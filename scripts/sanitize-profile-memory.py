#!/usr/bin/env python3
# SPDX-License-Identifier: Elastic-2.0
# Copyright (c) 2026 TG
"""Script de sanitização idempotente da Memória com backup, dry-run e transação SQLite."""

import argparse
import hashlib
import json
import shutil
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

WORKSPACE_ROOT = Path("/Users/pedrotgon/Developer/Start AI/tg-video-studio")
sys.path.insert(0, str(WORKSPACE_ROOT / "engines/dramaclaw/src"))
from novelvideo.client_profile import (
    validate_copy_block,
    validate_validation_event,
)

PROJECT_DIR = WORKSPACE_ROOT / "engines/dramaclaw/state/local/Thaix_Santiago_Perfil_e_Copies"
DB_PATH = PROJECT_DIR / "data.db"

ALLOWED_SPEECH_POSTS = {"Dce8x59SSP2", "Dcv2Yt4RBmX"}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_backup(path: Path) -> Path:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_path = path.parent / f"{path.name}.bak_{ts}"
    shutil.copy2(path, backup_path)
    return backup_path


def run_sanitization(dry_run: bool = False) -> dict:
    if not DB_PATH.is_file():
        raise FileNotFoundError(f"Banco não encontrado: {DB_PATH}")

    print(f"=== Sanitização da Memória de Thaix Santiago ===")
    print(f"Banco: {DB_PATH}")
    print(f"Modo: {'DRY-RUN (somente simulação)' if dry_run else 'EXECUÇÃO REAL COM TRANSAÇÃO'}")

    backup_file = None
    if not dry_run:
        backup_file = make_backup(DB_PATH)
        print(f"Backup de segurança criado em: {backup_file}")

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        "CREATE TABLE IF NOT EXISTS tg_profile_documents ("
        "kind TEXT NOT NULL, id TEXT NOT NULL, version INTEGER NOT NULL, payload TEXT NOT NULL, "
        "PRIMARY KEY(kind,id,version))"
    )

    # Inspeciona posts e transcrições atuais
    cursor.execute(
        "SELECT id, payload FROM tg_profile_documents d WHERE kind='post' "
        "AND version=(SELECT MAX(version) FROM tg_profile_documents WHERE kind=d.kind AND id=d.id)"
    )
    posts = {row["id"]: json.loads(row["payload"]) for row in cursor.fetchall()}

    cursor.execute(
        "SELECT id, payload FROM tg_profile_documents d WHERE kind='transcript' "
        "AND version=(SELECT MAX(version) FROM tg_profile_documents WHERE kind=d.kind AND id=d.id)"
    )
    transcripts = {row["id"]: json.loads(row["payload"]) for row in cursor.fetchall()}

    # Documentos a inserir/atualizar
    docs_to_save: list[tuple[str, str, dict]] = []

    # 1. Alias operacional AD 98
    docs_to_save.append((
        "alias",
        "AD_98",
        {
            "id": "AD_98",
            "alias": "AD 98",
            "name": "AD 98",
            "target_kind": "post",
            "target_id": "Da_JAVQSCPu",
            "status": "observed",
            "description": "Alias operacional para o post campeão Da_JAVQSCPu (6.6M plays). Sustenta legenda observada, CTA e formato visual. Não sustenta fala inexistente.",
            "source_ids": ["Da_JAVQSCPu"],
            "created_at": utc_now(),
        }
    ))

    # 2. Evento auditável do rebaixamento dos 7 itens sem validação documental prévia
    docs_to_save.append((
        "validation_event",
        "val_evt_sanitization_qa_demotion",
        {
            "id": "val_evt_sanitization_qa_demotion",
            "target_kind": "memory_item",
            "target_id": "ALL_7_PREVIOUSLY_APPROVED",
            "event_type": "sanitization_demotion",
            "approver_name": "QA Compliance Pipeline",
            "approver_role": "compliance_officer",
            "channel": "automated_pipeline",
            "evidence_ref": "audit_log_20260905_zero_validation_events",
            "timestamp": utc_now(),
            "notes": (
                "Rebaixamento técnico formal de 7 itens que constavam com client_approved sem prova documental. "
                "Status alterado para sem_validacao com 0 validation_events prévios. "
                "Itens mantidos como observados/inferidos para estudo, aguardando validação formal pela cliente Thaix Santiago."
            ),
        }
    ))

    # 3. Blocos literais de copy (copy_block) com offsets e timestamps rigorosamente verificados
    # Apenas Dce8x59SSP2 e Dcv2Yt4RBmX possuem source_kind = 'transcript' / fala!
    copy_blocks = [
        # Dce8x59SSP2 (Fala auditada)
        {
            "id": "blk_dce8_gancho",
            "post_id": "Dce8x59SSP2",
            "source_kind": "transcript",
            "source_ids": ["Dce8x59SSP2", "transcript_Dce8x59SSP2"],
            "literal_text": "E é o que descobriu o melhor canal no YouTube que faz a gente emagrecer muito se divertindo em casa.",
            "start_sec": 0.0,
            "end_sec": 4.86,
            "role": "gancho",
            "status": "observed",
            "confidence": 0.95,
            "is_sensitive": False,
            "policy_status": "allowed",
            "policy_risk": "low",
            "policy_reason": "",
            "reviewed_by": "automated_review",
            "reviewed_at": utc_now(),
        },
        {
            "id": "blk_dce8_mecanismo",
            "post_id": "Dce8x59SSP2",
            "source_kind": "transcript",
            "source_ids": ["Dce8x59SSP2", "transcript_Dce8x59SSP2"],
            "literal_text": "Diz que eliminam um quilo toda semana, e realmente fez a aula e derrete muito. E ela ensina o treino baixo impacto para quem é iniciante e está muito acidental.",
            "start_sec": 8.22,
            "end_sec": 17.66,
            "role": "mecanismo",
            "status": "observed",
            "confidence": 0.95,
            "is_sensitive": True,
            "policy_status": "blocked_from_generator",
            "policy_risk": "high",
            "policy_reason": "Promessa quantitativa fixa de perda de peso ('eliminam um quilo toda semana') e hipérbole 'derrete muito'",
            "reviewed_by": "automated_review",
            "reviewed_at": utc_now(),
        },
        {
            "id": "blk_dce8_cta",
            "post_id": "Dce8x59SSP2",
            "source_kind": "transcript",
            "source_ids": ["Dce8x59SSP2", "transcript_Dce8x59SSP2"],
            "literal_text": "Comenta o que vou te mandar no privado para você experimentar aí de casa.",
            "start_sec": 28.28,
            "end_sec": 32.46,
            "role": "cta",
            "status": "observed",
            "confidence": 0.95,
            "is_sensitive": False,
            "policy_status": "allowed",
            "policy_risk": "low",
            "policy_reason": "",
            "reviewed_by": "automated_review",
            "reviewed_at": utc_now(),
        },

        # Dcv2Yt4RBmX (Fala auditada)
        {
            "id": "blk_dcv2_gancho",
            "post_id": "Dcv2Yt4RBmX",
            "source_kind": "transcript",
            "source_ids": ["Dcv2Yt4RBmX", "transcript_Dcv2Yt4RBmX"],
            "literal_text": "O que quatro semanas de disciplina podem fazer por você. E olha que eu nunca consegui seguir diédoa.",
            "start_sec": 0.0,
            "end_sec": 4.44,
            "role": "gancho",
            "status": "observed",
            "confidence": 0.95,
            "is_sensitive": False,
            "policy_status": "allowed",
            "policy_risk": "low",
            "policy_reason": "",
            "reviewed_by": "automated_review",
            "reviewed_at": utc_now(),
        },
        {
            "id": "blk_dcv2_metrica_bio",
            "post_id": "Dcv2Yt4RBmX",
            "source_kind": "transcript",
            "source_ids": ["Dcv2Yt4RBmX", "transcript_Dcv2Yt4RBmX"],
            "literal_text": "O foco era queimar gordura e não perder peso. Por isso a gente mediu o meu percentual de gordura, o que tava bem alto. Eu comecei a desafiar com 79 quilos de quinhentos.",
            "start_sec": 19.72,
            "end_sec": 28.56,
            "role": "prova_contexto",
            "status": "observed",
            "confidence": 0.95,
            "is_sensitive": False,
            "policy_status": "allowed",
            "policy_risk": "low",
            "policy_reason": "",
            "reviewed_by": "automated_review",
            "reviewed_at": utc_now(),
        },
        {
            "id": "blk_dcv2_claim_extremo",
            "post_id": "Dcv2Yt4RBmX",
            "source_kind": "transcript",
            "source_ids": ["Dcv2Yt4RBmX", "transcript_Dcv2Yt4RBmX"],
            "literal_text": "Gente, isso daí em quilos, são 6 quilos de gordura em uma semana.",
            "start_sec": 70.8,
            "end_sec": 73.7,
            "role": "prova_contexto",
            "status": "observed",
            "confidence": 0.95,
            "is_sensitive": True,
            "policy_status": "blocked_from_generator",
            "policy_risk": "high",
            "policy_reason": "Alegação extrema de perda de 6 kg de gordura em 1 semana - bloqueada para reutilização no gerador",
            "reviewed_by": "automated_review",
            "reviewed_at": utc_now(),
        },
        {
            "id": "blk_dcv2_cta",
            "post_id": "Dcv2Yt4RBmX",
            "source_kind": "transcript",
            "source_ids": ["Dcv2Yt4RBmX", "transcript_Dcv2Yt4RBmX"],
            "literal_text": "Quero ter uma transformação dessa, comenta aqui embaixo o verão que eu vou te chamar no privado",
            "start_sec": 106.82,
            "end_sec": 110.42,
            "role": "cta",
            "status": "observed",
            "confidence": 0.95,
            "is_sensitive": False,
            "policy_status": "allowed",
            "policy_risk": "low",
            "policy_reason": "",
            "reviewed_by": "automated_review",
            "reviewed_at": utc_now(),
        },

        # Da_JAVQSCPu / AD 98 (Legenda observada; NÃO é fala)
        {
            "id": "blk_da_legenda_gancho",
            "post_id": "Da_JAVQSCPu",
            "source_kind": "caption",
            "source_ids": ["Da_JAVQSCPu"],
            "literal_text": "Emagrece! na música é MUITO MAIS DIVERTIDO🔥",
            "start_char": 0,
            "end_char": 43,
            "role": "gancho",
            "status": "observed",
            "confidence": 1.0,
            "is_sensitive": False,
            "policy_status": "allowed",
            "policy_risk": "low",
            "policy_reason": "",
            "reviewed_by": "automated_review",
            "reviewed_at": utc_now(),
        },
        {
            "id": "blk_da_legenda_desafio",
            "post_id": "Da_JAVQSCPu",
            "source_kind": "caption",
            "source_ids": ["Da_JAVQSCPu"],
            "literal_text": "Você consegue fazer essa música inteira?!",
            "start_char": 46,
            "end_char": 87,
            "role": "promessa",
            "status": "observed",
            "confidence": 1.0,
            "is_sensitive": False,
            "policy_status": "allowed",
            "policy_risk": "low",
            "policy_reason": "",
            "reviewed_by": "automated_review",
            "reviewed_at": utc_now(),
        },
        {
            "id": "blk_da_legenda_cta",
            "post_id": "Da_JAVQSCPu",
            "source_kind": "caption",
            "source_ids": ["Da_JAVQSCPu"],
            "literal_text": "comente “MUNDOFIT”",
            "start_char": 137,
            "end_char": 155,
            "role": "cta",
            "status": "observed",
            "confidence": 1.0,
            "is_sensitive": False,
            "policy_status": "allowed",
            "policy_risk": "low",
            "policy_reason": "",
            "reviewed_by": "automated_review",
            "reviewed_at": utc_now(),
        },

        # DauwjqVBoHh (Legenda observada)
        {
            "id": "blk_dauw_legenda_gancho",
            "post_id": "DauwjqVBoHh",
            "source_kind": "caption",
            "source_ids": ["DauwjqVBoHh"],
            "literal_text": "Se quer emagrecer rápido comece fazer esse treino BAIXO IMPACTO🔥",
            "start_char": 0,
            "end_char": 64,
            "role": "gancho",
            "status": "observed",
            "confidence": 1.0,
            "is_sensitive": True,
            "policy_status": "blocked_from_generator",
            "policy_risk": "high",
            "policy_reason": "Promessa de emagrecimento rápido sem respaldo clínico ('emagrecer rápido')",
            "reviewed_by": "automated_review",
            "reviewed_at": utc_now(),
        },
        {
            "id": "blk_dauw_legenda_cta",
            "post_id": "DauwjqVBoHh",
            "source_kind": "caption",
            "source_ids": ["DauwjqVBoHh"],
            "literal_text": "Comente “MUNDOFIT” ℹ️",
            "start_char": 101,
            "end_char": 122,
            "role": "cta",
            "status": "observed",
            "confidence": 1.0,
            "is_sensitive": False,
            "policy_status": "allowed",
            "policy_risk": "low",
            "policy_reason": "",
            "reviewed_by": "automated_review",
            "reviewed_at": utc_now(),
        },

        # DcUjm2eyjbC (Legenda observada)
        {
            "id": "blk_dcuj_legenda_gancho",
            "post_id": "DcUjm2eyjbC",
            "source_kind": "caption",
            "source_ids": ["DcUjm2eyjbC"],
            "literal_text": "porque na música, A GENTE EMAGRECE SE DIVERTINDO💋✨",
            "start_char": 0,
            "end_char": 50,
            "role": "gancho",
            "status": "observed",
            "confidence": 1.0,
            "is_sensitive": False,
            "policy_status": "allowed",
            "policy_risk": "low",
            "policy_reason": "",
            "reviewed_by": "automated_review",
            "reviewed_at": utc_now(),
        },
        {
            "id": "blk_dcuj_legenda_desafio",
            "post_id": "DcUjm2eyjbC",
            "source_kind": "caption",
            "source_ids": ["DcUjm2eyjbC"],
            "literal_text": "Você consegue fazer essa música inteira?!",
            "start_char": 52,
            "end_char": 93,
            "role": "promessa",
            "status": "observed",
            "confidence": 1.0,
            "is_sensitive": False,
            "policy_status": "allowed",
            "policy_risk": "low",
            "policy_reason": "",
            "reviewed_by": "automated_review",
            "reviewed_at": utc_now(),
        },
        {
            "id": "blk_dcuj_legenda_cta",
            "post_id": "DcUjm2eyjbC",
            "source_kind": "caption",
            "source_ids": ["DcUjm2eyjbC"],
            "literal_text": "Comente “QUERO”",
            "start_char": 139,
            "end_char": 155,
            "role": "cta",
            "status": "observed",
            "confidence": 1.0,
            "is_sensitive": False,
            "policy_status": "allowed",
            "policy_risk": "low",
            "policy_reason": "",
            "reviewed_by": "automated_review",
            "reviewed_at": utc_now(),
        },
    ]

    for blk in copy_blocks:
        # Condição 2: Verificação estrita antes de gravar
        validate_copy_block(
            blk,
            posts_lookup=posts,
            transcripts_lookup=transcripts,
        )
        docs_to_save.append(("copy_block", blk["id"], blk))

    # 3. Sanitização dos 17 itens de memória existentes + 2 novos de fala real
    sanitized_memory_items = [
        {
            "id": "mem_id_thaix",
            "alias": "Identidade Thaix",
            "tipo": "identidade",
            "titulo": "Thaix Santiago — Posicionamento de Marca",
            "texto_resumo": "Criadora e professora de Ritbox, foco em treinos de baixo impacto com música para emagrecimento na sala de casa.",
            "fonte_url": "https://www.instagram.com/thaix.santiago/",
            "post_id": None,
            "metricas": {"followers": "417 mil", "observed_plays": 12056145},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "observado",
            "status_de_validacao": "sem_validacao",
            "coluna": 1,
            "x": 130, "y": 80, "r": 24,
        },
        {
            "id": "mem_aud_mulheres",
            "alias": "Hipótese de Persona (Mulheres)",
            "tipo": "audiencia",
            "titulo": "Mulheres com Rotina Sobrecarregada (Inferido)",
            "texto_resumo": "Interpretação de audiência (rotina agitada, falta de tempo para academia). Faixa 28-55 anos não comprovada por dados demográficos.",
            "fonte_url": "https://www.instagram.com/thaix.santiago/",
            "post_id": None,
            "metricas": {},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "inferido",
            "status_de_validacao": "sem_validacao",
            "coluna": 1,
            "x": 130, "y": 165, "r": 20,
        },
        {
            "id": "mem_aud_dor_joelho",
            "alias": "Ângulo: Baixo Impacto / Sem Dor",
            "tipo": "audiencia",
            "titulo": "Ângulo de Copy: Treino Sem Impacto nos Joelhos",
            "texto_resumo": "Ângulo observado na legenda de DauwjqVBoHh ('sem dor no joelho'). A dor articular como patologia da aluna é inferência interpretativa.",
            "fonte_url": "https://www.instagram.com/p/DauwjqVBoHh/",
            "post_id": "DauwjqVBoHh",
            "metricas": {},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "observado",
            "status_de_validacao": "sem_validacao",
            "coluna": 1,
            "x": 130, "y": 245, "r": 19,
        },
        {
            "id": "mem_acervo_6m",
            "alias": "Post 6.6M (Desafio Musical)",
            "tipo": "acervo",
            "titulo": "Post 6.6M — Desafio Musical Ritbox",
            "texto_resumo": "Legenda observada: 'Emagrece! na música é MUITO MAIS DIVERTIDO🔥 Você consegue fazer essa música inteira?!... comente MUNDOFIT'.",
            "fonte_url": "https://www.instagram.com/p/Da_JAVQSCPu/",
            "post_id": "Da_JAVQSCPu",
            "metricas": {"plays": 6601593, "comments": 33266, "likes": 303550},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "observado",
            "status_de_validacao": "sem_validacao",
            "copy_falada": "SEM FALA DISCURSIVA (Trilha musical com percussão Ritbox e vocal cantado; sem fala da criadora)",
            "coluna": 1,
            "x": 130, "y": 330, "r": 24,
        },
        {
            "id": "mem_acervo_4m",
            "alias": "Post 4.1M (Baixo Impacto)",
            "tipo": "acervo",
            "titulo": "Post 4.1M — Ataque ao Impacto Articular",
            "texto_resumo": "Legenda observada: 'Se quer emagrecer rápido comece fazer esse treino BAIXO IMPACTO sem dor no joelho. Na sala da sua casa. Comente MUNDOFIT'.",
            "fonte_url": "https://www.instagram.com/p/DauwjqVBoHh/",
            "post_id": "DauwjqVBoHh",
            "metricas": {"plays": 4099020, "comments": 7069, "likes": 161200},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "observado",
            "status_de_validacao": "sem_validacao",
            "copy_falada": "SEM FALA DISCURSIVA (Música de treino rítmica com contagem e comandos vocais; sem diálogo)",
            "coluna": 1,
            "x": 130, "y": 415, "r": 22,
        },
        {
            "id": "mem_acervo_366k",
            "alias": "Post 366k (CTA QUERO)",
            "tipo": "acervo",
            "titulo": "Post 366k — Variação com CTA Direto QUERO",
            "texto_resumo": "Legenda observada: 'Quer destravar seu metabolismo sem esteira? Treino ritmado na batida do som. Comente QUERO...'.",
            "fonte_url": "https://www.instagram.com/p/DcUjm2eyjbC/",
            "post_id": "DcUjm2eyjbC",
            "metricas": {"plays": 366240, "comments": 1420, "likes": 18900},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "observado",
            "status_de_validacao": "sem_validacao",
            "copy_falada": "SEM FALA DISCURSIVA (Trilha musical com loop de treino; sem locução discursiva)",
            "coluna": 1,
            "x": 130, "y": 495, "r": 18,
        },

        # Padrões de Copy (Coluna 2)
        {
            "id": "mem_est_desafio_musical",
            "alias": "Padrão: Gancho Desafio",
            "tipo": "estrutura",
            "titulo": "Padrão de Gancho: Desafio da Música",
            "texto_resumo": "Pergunta provocatória na legenda e texto na tela se a aluna consegue acompanhar a batida até o final.",
            "fonte_url": "https://www.instagram.com/p/Da_JAVQSCPu/",
            "post_id": "Da_JAVQSCPu",
            "metricas": {},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "inferido",
            "status_de_validacao": "sem_validacao",
            "coluna": 2,
            "x": 380, "y": 100, "r": 21,
        },
        {
            "id": "mem_est_baixo_impacto",
            "alias": "Padrão: Mecanismo Baixo Impacto",
            "tipo": "estrutura",
            "titulo": "Mecanismo: Treino Ritmado Sem Pulos",
            "texto_resumo": "Movimentação compassada sem impacto articular descrita na legenda de DauwjqVBoHh.",
            "fonte_url": "https://www.instagram.com/p/DauwjqVBoHh/",
            "post_id": "DauwjqVBoHh",
            "metricas": {},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "inferido",
            "status_de_validacao": "sem_validacao",
            "coluna": 2,
            "x": 380, "y": 195, "r": 21,
        },
        {
            "id": "mem_est_sala_casa",
            "alias": "Padrão: Contexto Sala de Casa",
            "tipo": "estrutura",
            "titulo": "Contexto: Treino na Sala de Casa",
            "texto_resumo": "Treinar na sala de casa sem aparelhos, eliminando a barreira de deslocamento e vergonha.",
            "fonte_url": None,
            "post_id": None,
            "metricas": {},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "inferido",
            "status_de_validacao": "sem_validacao",
            "coluna": 2,
            "x": 380, "y": 290, "r": 18,
        },
        {
            "id": "mem_est_cta_mundofit",
            "alias": "CTA MUNDOFIT",
            "tipo": "estrutura",
            "titulo": "CTA Observado: Palavra-Chave MUNDOFIT",
            "texto_resumo": "Chamada literal para ação orientando comentar MUNDOFIT para recebimento de aula no Direct.",
            "fonte_url": "https://www.instagram.com/p/Da_JAVQSCPu/",
            "post_id": "Da_JAVQSCPu",
            "metricas": {},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "observado",
            "status_de_validacao": "sem_validacao",
            "coluna": 2,
            "x": 380, "y": 385, "r": 23,
        },
        {
            "id": "mem_est_cta_quero",
            "alias": "CTA QUERO",
            "tipo": "estrutura",
            "titulo": "CTA Observado: Palavra-Chave QUERO",
            "texto_resumo": "Chamada direta observada na legenda de DcUjm2eyjbC instruindo o comentário de 'QUERO'.",
            "fonte_url": "https://www.instagram.com/p/DcUjm2eyjbC/",
            "post_id": "DcUjm2eyjbC",
            "metricas": {},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "observado",
            "status_de_validacao": "sem_validacao",
            "coluna": 2,
            "x": 380, "y": 475, "r": 18,
        },

        # Validação / Métricas (Coluna 3)
        {
            "id": "mem_val_6m",
            "alias": "Métrica: 6.6M Plays",
            "tipo": "validacao",
            "titulo": "Alcance Orgânico de 6.6M de Reproduções",
            "texto_resumo": "Volume comprovado de 6.601.593 visualizações e 33.266 comentários. Comprova atração de atenção no Instagram, não vendas comerciais.",
            "fonte_url": "https://www.instagram.com/p/Da_JAVQSCPu/",
            "post_id": "Da_JAVQSCPu",
            "metricas": {"plays": 6601593, "comments": 33266},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "observado",
            "status_de_validacao": "sem_validacao",
            "coluna": 3,
            "x": 630, "y": 130, "r": 24,
        },
        {
            "id": "mem_val_4m",
            "alias": "Métrica: 4.1M Plays",
            "tipo": "validacao",
            "titulo": "Alcance Orgânico de 4.1M de Reproduções",
            "texto_resumo": "Volume comprovado de 4.099.020 visualizações e 7.069 comentários. Demonstra tração orgânica do ângulo sem dor nos joelhos.",
            "fonte_url": "https://www.instagram.com/p/DauwjqVBoHh/",
            "post_id": "DauwjqVBoHh",
            "metricas": {"plays": 4099020, "comments": 7069},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "observado",
            "status_de_validacao": "sem_validacao",
            "coluna": 3,
            "x": 630, "y": 260, "r": 22,
        },
        {
            "id": "mem_val_hipotese_20s",
            "alias": "Hipótese Duração 20s",
            "tipo": "validacao",
            "titulo": "Hipótese: Roteiros Curtos de 20s",
            "texto_resumo": "Hipótese estratégica de que roteiros de 20s aumentam retenção para anúncios. Ainda em fase de teste de validação.",
            "fonte_url": None,
            "post_id": None,
            "metricas": {},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "hipotese",
            "status_de_validacao": "em_teste",
            "coluna": 3,
            "x": 630, "y": 415, "r": 19,
        },

        # Produção Operacional (Coluna 4)
        {
            "id": "mem_prod_ad98",
            "alias": "AD 98",
            "tipo": "producao",
            "titulo": "AD 98 — Alias Operacional (Post Da_JAVQSCPu)",
            "texto_resumo": "Ativo operacional vinculado ao post Da_JAVQSCPu. Sustenta legenda e formato visual para multiplicação de criativos. Não contém fala transcrita.",
            "fonte_url": "https://www.instagram.com/p/Da_JAVQSCPu/",
            "post_id": "Da_JAVQSCPu",
            "metricas": {"plays": 6601593, "comments": 33266, "likes": 303550},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "observado",
            "status_de_validacao": "sem_validacao",
            "copy_falada": "SEM FALA DISCURSIVA (Trilha musical com percussão Ritbox e vocal cantado; sem fala da criadora)",
            "coluna": 4,
            "x": 855, "y": 155, "r": 26,
        },
        {
            "id": "mem_prod_roteiro_ad98",
            "alias": "Roteiro Visual AD 98",
            "tipo": "producao",
            "titulo": "Direção Visual Inferida para AD 98",
            "texto_resumo": "Roteiro não-verbal inferido a partir da observação do vídeo: pés no chão sem saltos e cortes na batida. Sem roteiro autoral de origem.",
            "fonte_url": None,
            "post_id": None,
            "metricas": {},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "inferido",
            "status_de_validacao": "sem_validacao",
            "copy_falada": "SEM FALA DISCURSIVA",
            "coluna": 4,
            "x": 855, "y": 295, "r": 20,
        },
        {
            "id": "mem_prod_video_ad98",
            "alias": "Vídeo Final AD 98",
            "tipo": "producao",
            "titulo": "Render Final AD 98 (Bloqueado)",
            "texto_resumo": "Nenhum arquivo de anúncio finalizado/renderizado foi persistido no acervo. Item bloqueado por ausência de mídia.",
            "fonte_url": None,
            "post_id": None,
            "metricas": {},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "bloqueado",
            "status_de_validacao": "sem_validacao",
            "copy_falada": "SEM FALA DISCURSIVA",
            "coluna": 4,
            "x": 855, "y": 420, "r": 18,
        },

        # Novos Itens com Fala Real Comprovada
        {
            "id": "mem_acervo_dce8",
            "alias": "Post 82k (Fala YouTube)",
            "tipo": "acervo",
            "titulo": "Post 82k — Locução Autêntica de Thaix Santiago",
            "texto_resumo": "Locução falada nítida em primeira pessoa: apresenta canal do YouTube, treino para iniciantes e CTA para envio no privado.",
            "fonte_url": "https://www.instagram.com/p/Dce8x59SSP2/",
            "post_id": "Dce8x59SSP2",
            "metricas": {"plays": 82948},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "observado",
            "status_de_validacao": "sem_validacao",
            "copy_falada": "E olha quem descobriu o melhor canal no YouTube que faz a gente emagrecer muito se divertindo em casa...",
            "coluna": 1,
            "x": 130, "y": 575, "r": 20,
        },
        {
            "id": "mem_acervo_dcv2",
            "alias": "Post 25k (Consulta Nutri)",
            "tipo": "acervo",
            "titulo": "Post 25k — Diálogo de Bioimpedância e Dieta",
            "texto_resumo": "Diálogo presencial entre Thaix e nutricionista Ana Paula: 79,5 kg, 27% para 19,4% de gordura, marmita com pão francês e CTA Comenta VERÃO.",
            "fonte_url": "https://www.instagram.com/p/Dcv2Yt4RBmX/",
            "post_id": "Dcv2Yt4RBmX",
            "metricas": {"plays": 25402},
            "observado_em": "2026-09-05T18:00:00Z",
            "status_de_evidencia": "observado",
            "status_de_validacao": "sem_validacao",
            "copy_falada": "O que quatro semanas de disciplina podem fazer por você. E olha que eu nunca consegui seguir dieta...",
            "coluna": 1,
            "x": 130, "y": 655, "r": 22,
        },
    ]

    for item in sanitized_memory_items:
        docs_to_save.append(("memory_item", item["id"], item))

    # 4. Relações tipadas rigorosas (relation)
    relations = [
        # Post -> Caption
        {"source_id": "Da_JAVQSCPu", "target_id": "blk_da_legenda_gancho", "relation_type": "POST_HAS_CAPTION", "status": "observed", "confidence": 1.0, "source_ids": ["Da_JAVQSCPu"]},
        {"source_id": "Da_JAVQSCPu", "target_id": "blk_da_legenda_cta", "relation_type": "POST_HAS_CAPTION", "status": "observed", "confidence": 1.0, "source_ids": ["Da_JAVQSCPu"]},
        {"source_id": "DauwjqVBoHh", "target_id": "blk_dauw_legenda_gancho", "relation_type": "POST_HAS_CAPTION", "status": "observed", "confidence": 1.0, "source_ids": ["DauwjqVBoHh"]},
        {"source_id": "Dce8x59SSP2", "target_id": "blk_dce8_gancho", "relation_type": "TRANSCRIPT_CONTAINS_BLOCK", "status": "observed", "confidence": 0.95, "source_ids": ["Dce8x59SSP2"]},
        {"source_id": "Dce8x59SSP2", "target_id": "blk_dce8_cta", "relation_type": "TRANSCRIPT_CONTAINS_BLOCK", "status": "observed", "confidence": 0.95, "source_ids": ["Dce8x59SSP2"]},
        {"source_id": "Dcv2Yt4RBmX", "target_id": "blk_dcv2_gancho", "relation_type": "TRANSCRIPT_CONTAINS_BLOCK", "status": "observed", "confidence": 0.95, "source_ids": ["Dcv2Yt4RBmX"]},
        {"source_id": "Dcv2Yt4RBmX", "target_id": "blk_dcv2_metrica_bio", "relation_type": "TRANSCRIPT_CONTAINS_BLOCK", "status": "observed", "confidence": 0.95, "source_ids": ["Dcv2Yt4RBmX"]},
        {"source_id": "Dcv2Yt4RBmX", "target_id": "blk_dcv2_cta", "relation_type": "TRANSCRIPT_CONTAINS_BLOCK", "status": "observed", "confidence": 0.95, "source_ids": ["Dcv2Yt4RBmX"]},

        # Relacionamento de AD 98 com o post e blocos
        {"source_id": "mem_prod_ad98", "target_id": "Da_JAVQSCPu", "relation_type": "COPY_DERIVED_FROM_POST", "status": "observed", "confidence": 1.0, "source_ids": ["Da_JAVQSCPu"]},
        {"source_id": "mem_prod_ad98", "target_id": "blk_da_legenda_gancho", "relation_type": "COPY_USES_BLOCK", "status": "observed", "confidence": 1.0, "source_ids": ["Da_JAVQSCPu"]},
        {"source_id": "mem_prod_ad98", "target_id": "blk_da_legenda_cta", "relation_type": "COPY_USES_BLOCK", "status": "observed", "confidence": 1.0, "source_ids": ["Da_JAVQSCPu"]},
        {"source_id": "mem_prod_ad98", "target_id": "mem_val_hipotese_20s", "relation_type": "COPY_TESTS_HYPOTHESIS", "status": "hypothesis", "confidence": 0.5, "source_ids": ["mem_prod_ad98"]},

        # Padrões e Evidências
        {"source_id": "mem_id_thaix", "target_id": "mem_est_baixo_impacto", "relation_type": "EVIDENCE_SUPPORTS_FACT", "status": "observed", "confidence": 1.0, "source_ids": ["https://www.instagram.com/thaix.santiago/"]},
        {"source_id": "mem_aud_dor_joelho", "target_id": "mem_est_baixo_impacto", "relation_type": "EVIDENCE_SUPPORTS_FACT", "status": "observed", "confidence": 1.0, "source_ids": ["DauwjqVBoHh"]},
        {"source_id": "Da_JAVQSCPu", "target_id": "mem_est_desafio_musical", "relation_type": "POST_EXHIBITS_STRUCTURE", "status": "observed", "confidence": 1.0, "source_ids": ["Da_JAVQSCPu"]},
        {"source_id": "Da_JAVQSCPu", "target_id": "mem_est_cta_mundofit", "relation_type": "POST_EXHIBITS_STRUCTURE", "status": "observed", "confidence": 1.0, "source_ids": ["Da_JAVQSCPu"]},
        {"source_id": "DauwjqVBoHh", "target_id": "mem_est_baixo_impacto", "relation_type": "POST_EXHIBITS_STRUCTURE", "status": "observed", "confidence": 1.0, "source_ids": ["DauwjqVBoHh"]},
        {"source_id": "DauwjqVBoHh", "target_id": "mem_est_cta_mundofit", "relation_type": "POST_EXHIBITS_STRUCTURE", "status": "observed", "confidence": 1.0, "source_ids": ["DauwjqVBoHh"]},
        {"source_id": "DcUjm2eyjbC", "target_id": "mem_est_cta_quero", "relation_type": "POST_EXHIBITS_STRUCTURE", "status": "observed", "confidence": 1.0, "source_ids": ["DcUjm2eyjbC"]},
        {"source_id": "Da_JAVQSCPu", "target_id": "mem_val_6m", "relation_type": "POST_HAS_METRIC_SNAPSHOT", "status": "observed", "confidence": 1.0, "source_ids": ["Da_JAVQSCPu"]},
        {"source_id": "DauwjqVBoHh", "target_id": "mem_val_4m", "relation_type": "POST_HAS_METRIC_SNAPSHOT", "status": "observed", "confidence": 1.0, "source_ids": ["DauwjqVBoHh"]},
    ]

    for rel in relations:
        rel_id = f"{rel['source_id']}__{rel['relation_type']}__{rel['target_id']}"
        docs_to_save.append(("relation", rel_id, rel))

    print(f"Total de documentos a processar: {len(docs_to_save)}")
    print(f"- Aliases: 1")
    print(f"- Blocos de copy: {len(copy_blocks)}")
    print(f"- Itens de memória sanitizados: {len(sanitized_memory_items)}")
    print(f"- Relações tipadas: {len(relations)}")

    if dry_run:
        print("\n[DRY-RUN] Simulação concluída com sucesso. Nenhuma alteração gravada.")
        conn.close()
        return {"dry_run": True, "count": len(docs_to_save)}

    try:
        cursor.execute("BEGIN IMMEDIATE")
        saved_count = 0
        for kind, doc_id, payload_dict in docs_to_save:
            # Verifica versão atual
            cursor.execute(
                "SELECT COALESCE(MAX(version),0), payload FROM tg_profile_documents WHERE kind=? AND id=?",
                (kind, doc_id)
            )
            row = cursor.fetchone()
            current_ver = row[0]
            current_payload = json.loads(row[1]) if row and row[1] else None

            # Idempotência: se o payload existente (sem metadados técnicos) for idêntico, não cria versão desnecessária
            ignore_keys = {"id", "version", "updated_at", "created_at", "reviewed_at", "timestamp"}
            new_payload_clean = {k: v for k, v in payload_dict.items() if k not in ignore_keys}
            if current_payload:
                curr_clean = {k: v for k, v in current_payload.items() if k not in ignore_keys}
                if curr_clean == new_payload_clean:
                    continue

            next_ver = current_ver + 1
            payload_with_meta = {
                **payload_dict,
                "id": doc_id,
                "version": next_ver,
                "updated_at": utc_now()
            }
            cursor.execute(
                "INSERT INTO tg_profile_documents (kind, id, version, payload) VALUES (?, ?, ?, ?)",
                (kind, doc_id, next_ver, json.dumps(payload_with_meta, ensure_ascii=False))
            )
            saved_count += 1

        conn.commit()
        print(f"\n[SUCESSO] Transação concluída! {saved_count} documentos gravados/atualizados.")
    except Exception as exc:
        conn.rollback()
        print(f"\n[ERRO] Transação abortada e desfeita: {exc}")
        raise
    finally:
        conn.close()

    return {"dry_run": False, "backup": str(backup_file), "saved": saved_count}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sanitização determinística da Memória")
    parser.add_argument("--dry-run", action="store_true", help="Executa sem persistir alterações")
    args = parser.parse_args()
    run_sanitization(dry_run=args.dry_run)
