import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from memory_store import memory_summary, profile_data


def test_memory_loads_complete_archive():
    data = profile_data()
    summary = memory_summary()
    assert len(data["posts"]) == 15
    assert len(data["transcripts"]) == 15
    assert summary["coverage"] == {"posts": 15, "transcripts": 15, "media": 6, "useful_speech": 2}
    assert len(summary["core"].encode("utf-8")) < 5_000


def test_sources_keep_provenance():
    for post in profile_data()["posts"]:
        assert post.get("id")
        assert post.get("source_url")
