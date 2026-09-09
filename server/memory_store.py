"""Small file-based memory reader for TG Video Studio."""

from functools import lru_cache
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MEMORY_ROOT = ROOT / "memory"
CLIENT_ROOT = MEMORY_ROOT / "clientes" / "thaix"


@lru_cache(maxsize=1)
def load_source_records() -> list[dict]:
    path = CLIENT_ROOT / "sources.ndjson"
    records: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            records.append(json.loads(line))
    return records


def profile_data() -> dict:
    records = load_source_records()
    grouped: dict[str, list[dict]] = {"post": [], "transcript": [], "copy_block": []}
    for record in records:
        kind = record.get("kind")
        if kind in grouped and isinstance(record.get("payload"), dict):
            grouped[kind].append(record["payload"])
    return {
        "posts": grouped["post"],
        "transcripts": grouped["transcript"],
        "copy_blocks": grouped["copy_block"],
        "memory_items": [],
        "relations": [],
    }


def memory_summary() -> dict:
    data = profile_data()
    useful = [item for item in data["transcripts"] if item.get("status") == "passed" and item.get("audio_status") == "present_speech" and str(item.get("transcript_literal") or "").strip()]
    media = [post for post in data["posts"] if post.get("media_file")]
    return {
        "core": (MEMORY_ROOT / "MEMORY.md").read_text(encoding="utf-8"),
        "profile": (CLIENT_ROOT / "profile.md").read_text(encoding="utf-8"),
        "coverage": {"posts": len(data["posts"]), "transcripts": len(data["transcripts"]), "media": len(media), "useful_speech": len(useful)},
        "sources": data["posts"],
    }
