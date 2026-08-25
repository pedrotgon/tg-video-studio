#!/usr/bin/env python3
"""Complete missing pt-BR locale entries with the local Ollama runtime.

Only entries that are still byte-for-byte equal to the English catalogue are
translated. Existing reviewed translations, keys, placeholders and markup are
preserved. The script is deterministic at temperature zero and validates every
batch before updating the catalogue.
"""

from __future__ import annotations

import json
import re
import time
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LOCALES = ROOT / "engines/dramaclaw/frontend/public/locales"
PT_PATH = LOCALES / "pt/translation.json"
EN_PATH = LOCALES / "en/translation.json"
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL = "granite3-dense:2b"
PLACEHOLDER = re.compile(r"\{\{[^{}]+\}\}|\$\{[^{}]+\}|<[^>]+>")


def flatten(value: object, prefix: tuple[str, ...] = ()) -> dict[tuple[str, ...], str]:
    result: dict[tuple[str, ...], str] = {}
    if isinstance(value, dict):
        for key, child in value.items():
            result.update(flatten(child, (*prefix, key)))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            result.update(flatten(child, (*prefix, str(index))))
    elif isinstance(value, str):
        result[prefix] = value
    return result


def assign(root: object, path: tuple[str, ...], value: str) -> None:
    cursor = root
    for part in path[:-1]:
        cursor = cursor[int(part)] if isinstance(cursor, list) else cursor[part]
    if isinstance(cursor, list):
        cursor[int(path[-1])] = value
    else:
        cursor[path[-1]] = value


def should_translate(value: str) -> bool:
    if not re.search(r"[A-Za-z]{3}", value):
        return False
    if re.fullmatch(r"(?:https?://|www\.|github\.com/).*", value.strip()):
        return False
    return True


def translate_batch(batch: dict[str, str]) -> dict[str, str]:
    protected: dict[str, str] = {}
    placeholder_maps: dict[str, list[tuple[str, str]]] = {}
    for key, value in batch.items():
        replacements: list[tuple[str, str]] = []

        def protect(match: re.Match[str]) -> str:
            token = f"__TGPH_{len(replacements)}__"
            replacements.append((token, match.group(0)))
            return token

        protected[key] = PLACEHOLDER.sub(protect, value)
        placeholder_maps[key] = replacements
    source = json.dumps(protected, ensure_ascii=False)
    prompt = f"""Você é tradutor profissional de software para português brasileiro.
Traduza SOMENTE os valores do JSON abaixo. Preserve exatamente as chaves, placeholders como {{{{count}}}}, tags, quebras de linha, atalhos, nomes de modelos, siglas, URLs e extensões. Use linguagem curta e natural de produto audiovisual brasileiro. Traduza episode como criativo, character como pessoa/avatar, props como objetos, shots/beats como quadros ou tomadas conforme o contexto, novel/script como roteiro e Freezone como Canvas. Não explique. Responda apenas com um objeto JSON válido com as mesmas chaves.

{source}"""
    payload = json.dumps(
        {
            "model": MODEL,
            "stream": False,
            "format": "json",
            "options": {"temperature": 0},
            "prompt": prompt,
        }
    ).encode()
    request = urllib.request.Request(
        OLLAMA_URL, data=payload, headers={"Content-Type": "application/json"}
    )
    response = json.load(urllib.request.urlopen(request, timeout=300))
    translated = json.loads(response["response"])
    if set(translated) != set(batch):
        raise ValueError("O modelo alterou as chaves do lote")
    for key, original in batch.items():
        value = translated[key]
        for token, placeholder in placeholder_maps[key]:
            value = value.replace(token, placeholder)
        translated[key] = value
        if not isinstance(value, str) or sorted(PLACEHOLDER.findall(value)) != sorted(
            PLACEHOLDER.findall(original)
        ):
            raise ValueError(f"Placeholders alterados em {key}")
    return translated


def translate_resilient(batch: dict[str, str]) -> dict[str, str]:
    """Split a problematic batch so one complex string cannot stop the run."""
    try:
        return translate_batch(batch)
    except Exception:
        if len(batch) == 1:
            key, original = next(iter(batch.items()))
            print(f"Mantendo entrada complexa para revisão manual: {key}")
            return {key: original}
        items = list(batch.items())
        middle = len(items) // 2
        return {
            **translate_resilient(dict(items[:middle])),
            **translate_resilient(dict(items[middle:])),
        }


def main() -> None:
    pt = json.loads(PT_PATH.read_text(encoding="utf-8"))
    en = json.loads(EN_PATH.read_text(encoding="utf-8"))
    flat_pt, flat_en = flatten(pt), flatten(en)
    pending = [
        (path, value)
        for path, value in flat_pt.items()
        if flat_en.get(path) == value and should_translate(value)
    ]
    print(f"Traduzindo {len(pending)} entradas pendentes com {MODEL}...")
    chunks: list[list[tuple[tuple[str, ...], str]]] = []
    current: list[tuple[tuple[str, ...], str]] = []
    current_chars = 0
    for item in pending:
        item_chars = len(item[1])
        if current and (len(current) >= 30 or current_chars + item_chars > 3500):
            chunks.append(current)
            current, current_chars = [], 0
        current.append(item)
        current_chars += item_chars
    if current:
        chunks.append(current)

    completed = 0
    for chunk in chunks:
        keyed = {str(index): value for index, (_, value) in enumerate(chunk)}
        translated = translate_resilient(keyed)
        for index, (path, _) in enumerate(chunk):
            assign(pt, path, translated[str(index)])
        PT_PATH.write_text(
            json.dumps(pt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        completed += len(chunk)
        print(f"{completed}/{len(pending)}")


if __name__ == "__main__":
    main()
