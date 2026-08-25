#!/usr/bin/env python3
"""Translate real CJK TypeScript/JSX UI literals using the compiler AST."""

from __future__ import annotations

import json
import os
import re
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

from localize_pt_br import translate_resilient


ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "scripts/audit_cjk_ui.mjs"
CACHE = ROOT / "scripts/.pt_br_cjk_cache.json"
APPLIER = ROOT / "scripts/apply_cjk_localization.mjs"
SEPARATOR = "[[[TGSEP]]]"
PROTECTED = re.compile(r"\{\{[^{}]+\}\}|\$\{[^{}]+\}|<[^>]+>")


def findings() -> list[dict[str, object]]:
    output = subprocess.check_output(
        ["node", str(AUDIT), "--json"], cwd=ROOT, text=True
    )
    return json.loads(output)


def translate_public(values: list[str]) -> dict[str, str]:
    protected_values: list[str] = []
    placeholder_maps: list[list[tuple[str, str]]] = []
    for value in values:
        placeholders: list[tuple[str, str]] = []

        def protect(match: re.Match[str]) -> str:
            token = f"__TGPH_{len(placeholders)}__"
            placeholders.append((token, match.group(0)))
            return token

        protected_values.append(PROTECTED.sub(protect, value))
        placeholder_maps.append(placeholders)
    query = urllib.parse.urlencode(
        {"q": f"\n{SEPARATOR}\n".join(protected_values), "langpair": "zh-CN|pt-BR"}
    )
    response = json.load(
        urllib.request.urlopen(
            f"https://api.mymemory.translated.net/get?{query}", timeout=30
        )
    )
    if response.get("quotaFinished") or response.get("responseStatus") != 200:
        raise RuntimeError("Cota pública indisponível")
    parts = response["responseData"]["translatedText"].split(SEPARATOR)
    if len(parts) != len(values):
        raise ValueError("O tradutor alterou os separadores")
    result: dict[str, str] = {}
    for value, part, placeholders in zip(values, parts, placeholder_maps):
        translated = part.strip()
        for token, placeholder in placeholders:
            translated = translated.replace(token, placeholder)
        result[value] = translated
    return result


def main() -> None:
    items = findings()
    if limit := int(os.environ.get("TG_LOCALIZE_LIMIT", "0")):
        items = items[:limit]
    unique = list(dict.fromkeys(str(item["value"]).strip() for item in items))
    unique = [value for value in unique if value]
    translated: dict[str, str] = (
        json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    )
    unique = [value for value in unique if value not in translated]
    print(f"Traduzindo {len(unique)} literais reais de interface ainda sem cache…")

    chunks: list[list[str]] = []
    current: list[str] = []
    chars = 0
    for value in unique:
        if current and (len(current) >= 20 or chars + len(value) > 400):
            chunks.append(current)
            current, chars = [], 0
        current.append(value)
        chars += len(value)
    if current:
        chunks.append(current)

    completed = 0
    for chunk in chunks:
        try:
            translated.update(translate_public(chunk))
        except Exception:
            result = translate_resilient(
                {str(i): value for i, value in enumerate(chunk)}
            )
            translated.update({value: result[str(i)] for i, value in enumerate(chunk)})
        CACHE.write_text(
            json.dumps(translated, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        completed += len(chunk)
        print(f"{completed}/{len(unique)}")

    subprocess.run(["node", str(APPLIER)], cwd=ROOT, check=True)


if __name__ == "__main__":
    main()
