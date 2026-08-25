import json
import re
from pathlib import Path


LOCALES = Path("frontend/public/locales")
LEGACY_BRANDS = re.compile(r"DramaClaw|SuperTale|Xiaji|Xiahua", re.IGNORECASE)
CJK = re.compile(r"[\u3400-\u9fff]")
ENGLISH_UI = re.compile(
    r"\b(the|and|to|of|for|is|are|with|from|your|this|that|open|close|select|"
    r"generate|failed|loading|save|cancel|delete|create|project|episode|character|"
    r"scene|settings|image|video|audio|showing|refresh|download|upload)\b",
    re.IGNORECASE,
)
PLACEHOLDER = re.compile(r"\{\{[^{}]+\}\}|\$\{[^{}]+\}|<[^>]+>")


def _strings(value: object, prefix: str = "") -> dict[str, str]:
    result: dict[str, str] = {}
    if isinstance(value, dict):
        for key, child in value.items():
            result.update(_strings(child, f"{prefix}.{key}" if prefix else key))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            result.update(_strings(child, f"{prefix}[{index}]"))
    elif isinstance(value, str):
        result[prefix] = value
    return result


def test_pt_br_catalogue_has_no_cjk_or_legacy_product_brands() -> None:
    pt = _strings(json.loads((LOCALES / "pt/translation.json").read_text()))

    assert {key: value for key, value in pt.items() if CJK.search(value)} == {}
    assert {
        key: value for key, value in pt.items() if LEGACY_BRANDS.search(value)
    } == {}


def test_pt_br_catalogue_does_not_fall_back_to_english_ui_sentences() -> None:
    pt = _strings(json.loads((LOCALES / "pt/translation.json").read_text()))
    en = _strings(json.loads((LOCALES / "en/translation.json").read_text()))
    untranslated = {
        key: value
        for key, value in pt.items()
        if en.get(key) == value and ENGLISH_UI.search(value)
    }

    assert untranslated == {}


def test_pt_br_catalogue_preserves_every_runtime_placeholder() -> None:
    pt = _strings(json.loads((LOCALES / "pt/translation.json").read_text()))
    en = _strings(json.loads((LOCALES / "en/translation.json").read_text()))
    mismatches = {
        key: {"en": PLACEHOLDER.findall(en[key]), "pt": PLACEHOLDER.findall(value)}
        for key, value in pt.items()
        if key in en
        and sorted(PLACEHOLDER.findall(en[key])) != sorted(PLACEHOLDER.findall(value))
    }

    assert mismatches == {}
