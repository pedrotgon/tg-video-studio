from pathlib import Path

import pytest

from novelvideo.api.routes.projects import _ensure_commercial_plan
from novelvideo.commercial_br import (
    COMMERCIAL_PLAN_VERSION,
    build_commercial_creatives,
    commercial_plan_fingerprint,
)
from novelvideo.models import NovelEpisode
from novelvideo.sqlite_store import SQLiteStore


def _output(variants: int = 5) -> dict:
    return {"variants": variants, "duration_seconds": 30, "aspect_ratio": "9:16"}


def test_commercial_plan_is_distinct_and_uses_the_received_briefing() -> None:
    campaign = {
        "audience": "donos de cafeteria",
        "offer": "Café especial brasileiro",
        "core_promise": "mais aroma e rastreabilidade",
        "cta": "Peça uma amostra",
        "primary_channel": "instagram_reels",
        "tone": "elegante e próximo",
    }

    creatives = build_commercial_creatives(campaign, _output())

    assert len(creatives) == 5
    assert len({item["hook"] for item in creatives}) == 5
    assert len({item["proof"] for item in creatives}) == 5
    assert len({item["script"] for item in creatives}) == 5
    assert all(item["cta"] == "Peça uma amostra" for item in creatives)
    assert all(item["promise"] == "mais aroma e rastreabilidade" for item in creatives)
    assert all("treino" not in item["script"].lower() for item in creatives)
    assert all(len(item["scenes"]) == 3 for item in creatives)
    combined = "\n".join(item["script"] for item in creatives)
    assert "Café especial brasileiro" in combined
    assert "donos de cafeteria" in combined


def test_different_campaigns_produce_different_plans() -> None:
    coffee = {
        "audience": "cafeterias",
        "offer": "café especial",
        "core_promise": "rastreabilidade",
        "cta": "Peça uma amostra",
    }
    software = {
        "audience": "pequenas empresas",
        "offer": "sistema de gestão",
        "core_promise": "organizar o atendimento",
        "cta": "Agende uma demonstração",
    }

    assert build_commercial_creatives(coffee, _output()) != build_commercial_creatives(
        software, _output()
    )
    assert commercial_plan_fingerprint(
        coffee, _output()
    ) != commercial_plan_fingerprint(software, _output())


def test_commercial_plan_limits_variants_and_duration() -> None:
    campaign = {"offer": "produto", "core_promise": "benefício", "cta": "Conheça"}
    creatives = build_commercial_creatives(
        campaign,
        {"variants": 99, "duration_seconds": 999, "aspect_ratio": "4:5"},
    )

    assert len(creatives) == 10
    assert {item["duration_seconds"] for item in creatives} == {60}
    assert {item["aspect_ratio"] for item in creatives} == {"4:5"}
    assert COMMERCIAL_PLAN_VERSION >= 2


@pytest.mark.asyncio
async def test_legacy_commercial_plan_is_migrated_once_and_updates_episodes(
    tmp_path: Path,
) -> None:
    state_dir = tmp_path / "state"
    output_dir = tmp_path / "output"
    campaign = {
        "audience": "cafeterias",
        "offer": "café especial",
        "core_promise": "rastreabilidade",
        "cta": "Peça uma amostra",
    }
    output = _output(2)
    legacy = {
        "content_profile": "commercial_br",
        "campaign": campaign,
        "output": output,
        "creatives": [{"number": 1, "title": "Modelo antigo"}],
    }
    store = SQLiteStore("alice/campanha", output_dir=output_dir, state_dir=state_dir)
    await store.initialize()
    await store.add_episode(NovelEpisode(number=1, title="Modelo antigo"))
    await store.close()

    migrated = await _ensure_commercial_plan(
        config=legacy,
        state_dir=state_dir,
        output_dir=output_dir,
        username="alice",
        project_name="campanha",
    )

    assert migrated["commercial_plan_version"] == COMMERCIAL_PLAN_VERSION
    assert migrated["commercial_plan_fingerprint"] == commercial_plan_fingerprint(
        campaign, output
    )
    store = SQLiteStore("alice/campanha", output_dir=output_dir, state_dir=state_dir)
    await store.initialize()
    episodes = await store.list_episodes()
    await store.close()
    assert [episode.number for episode in episodes] == [1, 2]
    assert all("café especial" in episode.beat_source_text for episode in episodes)
    assert all("treino" not in episode.beat_source_text.lower() for episode in episodes)
