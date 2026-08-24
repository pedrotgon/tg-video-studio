"""Generate the pt-BR DramaClaw locale using the already configured Gemini provider."""

import json
import sys
import tomllib
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from google import genai
from google.genai import types

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "engines/dramaclaw/frontend/public/locales/en/translation.json"
TARGET = ROOT / "engines/dramaclaw/frontend/public/locales/pt/translation.json"
CONFIG = ROOT / "engines/moneyprinter/config.toml"

source = json.loads(SOURCE.read_text())
app_config = tomllib.loads(CONFIG.read_text()).get("app", {})
api_key = app_config.get("gemini_api_key", "")
model = app_config.get("gemini_model_name", "gemini-2.5-flash")
if not api_key:
    raise SystemExit("Gemini não está configurado no MoneyPrinterTurbo")

strings: list[str] = []


def collect(value):
    if isinstance(value, str):
        strings.append(value)
    elif isinstance(value, list):
        for child in value:
            collect(child)
    elif isinstance(value, dict):
        for child in value.values():
            collect(child)


collect(source)
unique = list(dict.fromkeys(strings))
chunks = [unique[index:index + 220] for index in range(0, len(unique), 220)]


def translate_chunk(index_and_chunk):
    index, chunk = index_and_chunk
    payload = {str(position): value for position, value in enumerate(chunk)}
    prompt = (
        "Traduza todos os valores do JSON para português brasileiro natural, "
        "premium e conciso para um software profissional de produção audiovisual. "
        "Preserve exatamente placeholders {{...}}, tags, URLs, atalhos, nomes de "
        "modelos, extensões e códigos. Não altere as chaves numéricas. Retorne "
        "somente o objeto JSON completo.\n" + json.dumps(payload, ensure_ascii=False)
    )
    for attempt in range(3):
        try:
            with genai.Client(api_key=api_key) as client:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0,
                        response_mime_type="application/json",
                        max_output_tokens=16384,
                    ),
                )
            output = json.loads(response.text)
            if len(output) != len(chunk):
                raise ValueError("quantidade de textos diferente do lote")
            print(f"lote {index + 1}/{len(chunks)} traduzido", flush=True)
            return {original: str(output.get(str(position), original)) for position, original in enumerate(chunk)}
        except Exception as exc:
            if attempt == 2:
                print(f"lote {index + 1} com fallback: {type(exc).__name__}", file=sys.stderr, flush=True)
                return {original: original for original in chunk}


translated: dict[str, str] = {}
with ThreadPoolExecutor(max_workers=3) as executor:
    futures = [executor.submit(translate_chunk, item) for item in enumerate(chunks)]
    for future in as_completed(futures):
        translated.update(future.result())


def rebuild(value):
    if isinstance(value, str):
        return translated.get(value, value)
    if isinstance(value, list):
        return [rebuild(child) for child in value]
    if isinstance(value, dict):
        return {key: rebuild(child) for key, child in value.items()}
    return value


TARGET.parent.mkdir(parents=True, exist_ok=True)
TARGET.write_text(json.dumps(rebuild(source), ensure_ascii=False, indent=2) + "\n")
print(f"pt-BR concluído: {len(unique)} textos", flush=True)
