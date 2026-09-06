# SPDX-License-Identifier: Elastic-2.0
# Copyright (c) 2026 TG
"""Real SQLite and deterministic contracts; no model/network mocks."""

import json
import sqlite3
import pytest
from novelvideo.client_profile import (
    ProfileStore,
    compose_locked,
    validate_blocks,
    parse_json,
)
from novelvideo.api.routes.client_profile import PostInput, validate_qualifier_payload


def test_profile_versions_survive_new_connection(tmp_path):
    store = ProfileStore(tmp_path)
    first = store.save("profile", "client", {"handle": "thaix.santiago"}, 0)
    second = store.save(
        "profile",
        "client",
        {"handle": "thaix.santiago", "facts": "Revisar provas"},
        first["version"],
    )
    assert ProfileStore(tmp_path).get("profile", "client") == second
    with sqlite3.connect(tmp_path / "data.db") as db:
        assert (
            db.execute("SELECT COUNT(*) FROM tg_profile_documents").fetchone()[0] == 2
        )


def test_stale_edit_rejected(tmp_path):
    store = ProfileStore(tmp_path)
    store.save("post", "DauwjqVBoHh", {"caption": "Comente “MUNDOFIT” ℹ️"}, 0)
    with pytest.raises(ValueError):
        store.save("post", "DauwjqVBoHh", {}, 0)


def test_project_isolation(tmp_path):
    a, b = tmp_path / "a", tmp_path / "b"
    a.mkdir()
    b.mkdir()
    ProfileStore(a).save("profile", "client", {"handle": "thaix.santiago"})
    assert ProfileStore(b).get("profile", "client") is None


def test_locked_text_preserved_exactly():
    blocks = [
        {"id": "a", "text": "Acesse uma aula completa gratuita\n", "locked": False},
        {"id": "b", "text": "Comente “MUNDOFIT” ℹ️", "locked": True},
    ]
    assert (
        compose_locked(blocks, {"a": "Conheça a aula.\n"})
        == "Conheça a aula.\nComente “MUNDOFIT” ℹ️"
    )
    for invalid in ({}, {"a": "", "b": "troca"}, {"a": "válido", "b": "alterado"}):
        with pytest.raises(ValueError):
            compose_locked(blocks, invalid)


def test_structure_must_preserve_source():
    validate_blocks("a\nb", [{"id": "1", "text": "a\n"}, {"id": "2", "text": "b"}])
    with pytest.raises(ValueError):
        validate_blocks("a\nb", [{"id": "1", "text": "a"}, {"id": "2", "text": "b"}])


@pytest.mark.parametrize(
    "url",
    [
        "http://localhost/video",
        "https://www.instagram.com.evil.test/p/abc/",
        "https://www.instagram.com/../../p/abc/",
    ],
)
def test_reject_untrusted_source_url(url):
    with pytest.raises(ValueError):
        PostInput(source_url=url)


def test_real_post_url_and_unicode():
    value = PostInput(
        source_url="https://www.instagram.com/thaix.santiago/reel/DauwjqVBoHh/",
        caption="Comente “MUNDOFIT” ℹ️",
    )
    assert value.caption.endswith("ℹ️")
    assert parse_json('```json\n{"ok":true}\n```') == {"ok": True}


def test_copy_qualification_enforces_brevity_contract():
    valid = {
        "questions": [
            {"id": "goal", "question": "Qual objetivo?", "options": [{"id": "a", "label": "Converter"}, {"id": "b", "label": "Engajar"}]},
            {"id": "tone", "question": "Qual tom?", "options": [{"id": "a", "label": "Direto"}, {"id": "b", "label": "Leve"}]},
            {"id": "action", "question": "Qual ação?", "options": [{"id": "a", "label": "Comentar"}, {"id": "b", "label": "Salvar"}]},
        ]
    }
    assert validate_qualifier_payload(valid) == valid["questions"]
    too_long = json.loads(json.dumps(valid))
    too_long["questions"][0]["question"] = "Esta pergunta ultrapassa vinte caracteres"
    with pytest.raises(ValueError, match="question too long"):
        validate_qualifier_payload(too_long)
    long_option = json.loads(json.dumps(valid))
    long_option["questions"][0]["options"][0]["label"] = "Muito comprido"
    with pytest.raises(ValueError, match="option too long"):
        validate_qualifier_payload(long_option)


def test_speech_block_restricted_to_allowed_posts():
    from novelvideo.client_profile import ALLOWED_SPEECH_POSTS, validate_copy_block

    # Posts permitidos com fala auditada
    for pid in ALLOWED_SPEECH_POSTS:
        valid_block = {
            "id": f"blk_{pid}_gancho",
            "post_id": pid,
            "source_kind": "transcript",
            "literal_text": "Trecho falado auditado pela ferramenta.",
            "role": "gancho",
            "status": "observed",
            "source_ids": [pid],
            "start_sec": 0.0,
            "end_sec": 4.5,
        }
        validate_copy_block(valid_block)

    # Post sem fala discursiva tentando cadastrar bloco de fala -> REJEIÇÃO
    forbidden_speech_block = {
        "id": "blk_da_fake_speech",
        "post_id": "Da_JAVQSCPu",
        "source_kind": "transcript",
        "literal_text": "Fala inexistente inventada.",
        "role": "gancho",
        "status": "observed",
        "source_ids": ["Da_JAVQSCPu"],
        "start_sec": 0.0,
        "end_sec": 3.0,
    }
    with pytest.raises(ValueError, match="Apenas os posts .* possuem fala auditada"):
        validate_copy_block(forbidden_speech_block)

    # Post sem áudio permitindo legenda e visual normalmente com offsets
    valid_caption_block = {
        "id": "blk_da_legenda",
        "post_id": "Da_JAVQSCPu",
        "source_kind": "caption",
        "literal_text": "Desafio ritmado na batida da música.",
        "role": "gancho",
        "status": "observed",
        "source_ids": ["Da_JAVQSCPu"],
        "start_char": 0,
        "end_char": 36,
    }
    validate_copy_block(valid_caption_block)


def test_speech_requires_matching_source_text_and_interval():
    from novelvideo.client_profile import ALLOWED_SPEECH_POSTS, validate_copy_block
    pid = next(iter(ALLOWED_SPEECH_POSTS))
    block = dict(id="speech", post_id=pid, source_kind="speech", literal_text="Olá mundo",
                 role="gancho", status="observed", source_ids=[pid], start_sec=1, end_sec=2)
    source = {pid: {"segments": [{"start": 1, "end": 2, "text": "Olá mundo"}]}}
    validate_copy_block(block, transcripts_lookup=source)
    for lookup in ({}, {pid: {"segments": []}}):
        with pytest.raises(ValueError):
            validate_copy_block(block, transcripts_lookup=lookup)
    for changes in ({"literal_text": "Texto inventado"}, {"end_sec": 200}, {"start_sec": 0}):
        with pytest.raises(ValueError):
            validate_copy_block({**block, **changes}, transcripts_lookup=source)


def test_relation_rejects_self_relation_missing_sources_and_orphans():
    from novelvideo.client_profile import validate_relation

    # 1. Relação reflexiva (source == target) -> REJEIÇÃO
    self_rel = {
        "source_id": "Da_JAVQSCPu",
        "target_id": "Da_JAVQSCPu",
        "relation_type": "POST_HAS_CAPTION",
        "status": "observed",
        "source_ids": ["Da_JAVQSCPu"],
    }
    with pytest.raises(ValueError, match="Relação reflexiva proibida"):
        validate_relation(self_rel)

    # 2. Ausência de source_ids rastreáveis -> REJEIÇÃO
    no_source_rel = {
        "source_id": "Da_JAVQSCPu",
        "target_id": "blk_da_legenda",
        "relation_type": "POST_HAS_CAPTION",
        "status": "observed",
        "source_ids": [],
    }
    with pytest.raises(ValueError, match="exige source_ids rastreáveis"):
        validate_relation(no_source_rel)

    # 3. Referência órfã (origem ou destino não existem) -> REJEIÇÃO
    known_entities = {"Da_JAVQSCPu", "blk_da_legenda"}
    orphan_rel = {
        "source_id": "Da_JAVQSCPu",
        "target_id": "entidade_fantasma_xyz",
        "relation_type": "POST_HAS_CAPTION",
        "status": "observed",
        "source_ids": ["Da_JAVQSCPu"],
    }
    with pytest.raises(ValueError, match="Referência órfã detectada"):
        validate_relation(orphan_rel, existing_ids=known_entities)

    # 4. Relação válida
    valid_rel = {
        "source_id": "Da_JAVQSCPu",
        "target_id": "blk_da_legenda",
        "relation_type": "POST_HAS_CAPTION",
        "status": "observed",
        "source_ids": ["Da_JAVQSCPu"],
    }
    validate_relation(valid_rel, existing_ids=known_entities)


def test_transaction_rollback_on_error(tmp_path):
    store = ProfileStore(tmp_path)
    store.save("post", "post_1", {"title": "Post Inicial"}, 0)

    # Tenta salvar múltiplos documentos em transação; força erro no segundo
    with pytest.raises(RuntimeError, match="Falha simulada no meio da transacao"):
        with store.transaction() as db:
            store.save_in_tx(db, "post", "post_2", {"title": "Post 2"})
            raise RuntimeError("Falha simulada no meio da transacao")

    # post_2 NÃO deve ter sido gravado (rollback atômico garantido)
    assert store.get("post", "post_2") is None
    assert store.get("post", "post_1") is not None


def test_idempotency_avoids_duplicate_versions(tmp_path):
    store = ProfileStore(tmp_path)
    # Primeiro salvamento
    saved_1 = store.save("memory_item", "mem_1", {"alias": "Item 1", "status_de_evidencia": "observado"})
    assert saved_1["version"] == 1

    # Salvamento idêntico posterior -> Não incrementa versão, retorna existente
    saved_2 = store.save("memory_item", "mem_1", {"alias": "Item 1", "status_de_evidencia": "observado"})
    assert saved_2["version"] == 1

    # Alteração real de campo -> Incrementa versão
    saved_3 = store.save("memory_item", "mem_1", {"alias": "Item 1 Atualizado", "status_de_evidencia": "observado"})
    assert saved_3["version"] == 2

    # Histórico contém apenas as versões reais
    history = store.history("memory_item", "mem_1")
    assert len(history) == 2


def test_coverage_summary_separates_client_approval_and_commercial_validation(tmp_path):
    store = ProfileStore(tmp_path)
    store.save("post", "Dce8x59SSP2", {"media_file": "video.mp4"})
    store.save("post", "Da_JAVQSCPu", {"media_file": "music.mp4"})
    store.save("post", "D9999999999", {})  # Sem media_file

    store.save("memory_item", "item_cliente", {
        "status_de_evidencia": "observado",
        "status_de_validacao": "client_approved",
    })
    store.save("memory_item", "item_comercial", {
        "status_de_evidencia": "observado",
        "status_de_validacao": "commercially_validated",
    })
    store.save("memory_item", "item_sem_validacao", {
        "status_de_evidencia": "inferido",
        "status_de_validacao": "sem_validacao",
    })

    # Sem validation_event -> client_approved_total E commercially_validated_total são 0
    summary_before = store.get_coverage_summary()
    assert summary_before["client_approved_total"] == 0
    assert summary_before["commercially_validated_total"] == 0
    assert summary_before["sem_validacao_total"] == 3  # Todos sem validação comprovada

    # Registra validation_event de aprovação do cliente para item_cliente
    store.save("validation_event", "evt_client_appr_1", {
        "target_kind": "memory_item",
        "target_id": "item_cliente",
        "event_type": "client_approval",
        "status": "executed",
        "audit_log": "Aprovado pelo cliente em reunião",
        "decided_by": "cliente",
    })

    # Registra validation_event comercial para item_comercial
    store.save("validation_event", "evt_comm_val_1", {
        "target_kind": "memory_item",
        "target_id": "item_comercial",
        "event_type": "commercial_validation",
        "status": "executed",
        "audit_log": "Validado com ROAS comprovado",
        "decided_by": "growth_lead",
    })

    summary_after = store.get_coverage_summary()
    assert summary_after["posts_total"] == 3
    assert summary_after["media_files_total"] == 2
    assert summary_after["useful_speech_total"] == 1  # Apenas Dce8x59SSP2 tem fala e media_file
    assert summary_after["blocked_no_media_total"] == 1  # D9999999999
    assert summary_after["music_no_speech_total"] == 1  # Da_JAVQSCPu tem media mas sem fala
    assert summary_after["client_approved_total"] == 1  # Agora sim possui validation_event de cliente
    assert summary_after["commercially_validated_total"] == 1  # Possui validation_event comercial
    assert summary_after["validation_events_total"] == 2
    assert summary_after["sem_validacao_total"] == 1  # Apenas item_sem_validacao


def test_sensitive_claims_quarantined_from_generator_prompt(tmp_path):
    store = ProfileStore(tmp_path)
    # Post com claim sensível na legenda bruta
    store.save("post", "DauwjqVBoHh", {
        "source_url": "https://www.instagram.com/p/DauwjqVBoHh/",
        "caption": "Se quer emagrecer rápido comece fazer esse treino sem dor no joelho.",
        "metrics": {"plays": 4099020},
    })
    # Copy block com alegação sensível
    store.save("copy_block", "blk_sensivel", {
        "post_id": "DauwjqVBoHh",
        "source_kind": "caption",
        "literal_text": "emagrecer rápido sem dor no joelho",
        "role": "gancho",
        "status": "observed",
        "source_ids": ["DauwjqVBoHh"],
        "start_char": 8,
        "end_char": 43,
        "policy_status": "blocked_from_generator",
        "policy_reason": "Promessa de emagrecimento rápido sem dor",
    })

    bundle = store.get_context_bundle("DauwjqVBoHh")
    # A legenda bruta enviada no bundle DEVE estar sanitizada (Condição 1)
    caption_text = bundle["caption_spans"][0]["text"]
    assert "emagrecer rápido" not in caption_text
    assert "[ALEGAÇÃO SENSÍVEL SUPRIMIDA" in caption_text

    # O bloco com policy_status='blocked_from_generator' NÃO entra nos spans de prompt
    assert not any(b.get("block_id") == "blk_sensivel" for b in bundle["caption_spans"] if "block_id" in b)
    # Entra na quarentena explícita
    assert any(q.get("block_id") == "blk_sensivel" for q in bundle["quarantined_sensitive_blocks"])


def test_copy_block_offsets_verified_against_raw_text():
    from novelvideo.client_profile import validate_copy_block
    posts = {
        "DauwjqVBoHh": {
            "caption": "Se quer emagrecer rápido comece fazer esse treino BAIXO IMPACTO sem dor no joelho. Na sala da sua casa. Comente MUNDOFIT para aula completa"
        }
    }
    # Offset exato correto
    valid_block = {
        "id": "blk_correto",
        "post_id": "DauwjqVBoHh",
        "source_kind": "caption",
        "literal_text": "Na sala da sua casa",
        "role": "mecanismo",
        "status": "observed",
        "source_ids": ["DauwjqVBoHh"],
        "start_char": 83,
        "end_char": 102,
    }
    validate_copy_block(valid_block, posts_lookup=posts)

    # Offset divergente do texto real -> Erro estrito (Condição 2)
    tampered_block = {
        "id": "blk_adulterado",
        "post_id": "DauwjqVBoHh",
        "source_kind": "caption",
        "literal_text": "Texto que não está nessa posição",
        "role": "mecanismo",
        "status": "observed",
        "source_ids": ["DauwjqVBoHh"],
        "start_char": 83,
        "end_char": 102,
    }
    with pytest.raises(ValueError, match="divergem da legenda real"):
        validate_copy_block(tampered_block, posts_lookup=posts)


def test_alias_and_context_bundle_evidence_limits(tmp_path):
    store = ProfileStore(tmp_path)
    store.save("post", "Da_JAVQSCPu", {
        "source_url": "https://www.instagram.com/p/Da_JAVQSCPu/",
        "caption": "Emagrece na música! Comente MUNDOFIT",
        "metrics": {"plays": 6601593},
    })
    store.save("alias", "AD_98", {
        "alias": "AD 98",
        "target_kind": "post",
        "target_id": "Da_JAVQSCPu",
    })

    # Consulta por alias operacional "AD 98"
    bundle = store.get_context_bundle("AD 98")
    assert bundle["entity"]["post_id"] == "Da_JAVQSCPu"
    assert len(bundle["caption_spans"]) == 1
    assert len(bundle["transcript_spans"]) == 0
    # Limitação explícita que proíbe inferir fala ou vendas
    assert any("trilha sonora musical" in lim for lim in bundle["limitations"])
    assert any("distribuição" in lim for lim in bundle["limitations"])


@pytest.mark.asyncio
async def test_slug_and_ulid_resolve_to_same_project(tmp_path, monkeypatch):
    from novelvideo import config
    from novelvideo.ports.local.project import SQLiteProjectRegistry

    monkeypatch.setattr(config, "STATE_DIR", tmp_path)
    registry = SQLiteProjectRegistry()
    await registry._ensure_schema()

    record = await registry.create_project(
        owner_user_id="local",
        owner_username="local",
        name="Thaix_Santiago_Perfil_e_Copies",
    )
    ulid_id = record.id
    slug_name = record.name

    # Resolução por ULID
    by_ulid = await registry.get_project(ulid_id)
    # Resolução por Slug / Name
    by_slug = await registry.get_project(slug_name)

    assert by_ulid is not None
    assert by_slug is not None
    assert by_ulid.id == by_slug.id
    assert by_ulid.state_dir == by_slug.state_dir
