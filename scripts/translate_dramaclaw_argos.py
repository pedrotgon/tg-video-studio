"""Offline English → Brazilian Portuguese locale generation with Argos Translate."""

import json
import re
from pathlib import Path

import argostranslate.package
import argostranslate.translate

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "engines/dramaclaw/frontend/public/locales/en/translation.json"
TARGET = ROOT / "engines/dramaclaw/frontend/public/locales/pt/translation.json"

installed = argostranslate.translate.get_installed_languages()
english = next((language for language in installed if language.code == "en"), None)
portuguese = next((language for language in installed if language.code == "pt"), None)
if english is None or portuguese is None:
    argostranslate.package.update_package_index()
    packages = argostranslate.package.get_available_packages()
    package = next(item for item in packages if item.from_code == "en" and item.to_code == "pt")
    argostranslate.package.install_from_path(package.download())
    installed = argostranslate.translate.get_installed_languages()
    english = next(language for language in installed if language.code == "en")
    portuguese = next(language for language in installed if language.code == "pt")

translator = english.get_translation(portuguese)
source = json.loads(SOURCE.read_text())
cache: dict[str, str] = {}
protected_pattern = re.compile(r"(\{\{[^}]+\}\}|https?://\S+|\b[A-Za-z0-9_.-]+\.(?:mp4|json|wav|mp3|png|jpg|zip)\b)")


def translate_text(text: str) -> str:
    if text in cache:
        return cache[text]
    tokens: list[str] = []

    def protect(match):
        tokens.append(match.group(0))
        return f" ZXQ{len(tokens) - 1}QXZ "

    protected = protected_pattern.sub(protect, text)
    result = translator.translate(protected)
    for index, token in enumerate(tokens):
        result = result.replace(f"ZXQ{index}QXZ", token).replace(f"ZXQ {index} QXZ", token)
    cache[text] = result.strip()
    if len(cache) % 100 == 0:
        print(f"{len(cache)} textos traduzidos", flush=True)
    return cache[text]


def rebuild(value):
    if isinstance(value, str):
        return translate_text(value)
    if isinstance(value, list):
        return [rebuild(child) for child in value]
    if isinstance(value, dict):
        return {key: rebuild(child) for key, child in value.items()}
    return value


TARGET.parent.mkdir(parents=True, exist_ok=True)
TARGET.write_text(json.dumps(rebuild(source), ensure_ascii=False, indent=2) + "\n")
print(f"pt-BR concluído: {len(cache)} textos únicos", flush=True)
