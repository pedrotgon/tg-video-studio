# SPDX-License-Identifier: Elastic-2.0
# Copyright (c) 2026 TG
"""Versioned client evidence inside the existing project SQLite database."""

from __future__ import annotations

import json
import re
import sqlite3
import unicodedata
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

ALLOWED_SPEECH_POSTS = {"Dce8x59SSP2", "Dcv2Yt4RBmX"}

ALLOWED_RELATION_TYPES = {
    "POST_HAS_CAPTION",
    "POST_HAS_TRANSCRIPT",
    "TRANSCRIPT_CONTAINS_BLOCK",
    "POST_HAS_METRIC_SNAPSHOT",
    "POST_EXHIBITS_STRUCTURE",
    "COPY_DERIVED_FROM_POST",
    "COPY_USES_BLOCK",
    "COPY_TESTS_HYPOTHESIS",
    "COPY_APPROVED_BY_EVENT",
    "ROTEIRO_EXECUTES_COPY",
    "VIDEO_EXECUTES_ROTEIRO",
    "EVIDENCE_SUPPORTS_FACT",
    "MEMORY_SUPERSEDES_MEMORY",
    "MEMORY_CONFLICTS_WITH_MEMORY",
}

VALID_STATUSES = {"observed", "inferred", "hypothesis", "blocked", "unsupported"}
VALID_ROLES = {
    "gancho",
    "problema",
    "promessa",
    "mecanismo",
    "prova_contexto",
    "objecao",
    "transicao",
    "cta",
    "ritmo",
}

VALID_EVENT_TYPES = {
    "client_approval",
    "commercial_validation",
    "technical_qa",
    "sanitization_demotion",
}

VALID_APPROVER_ROLES = {
    "client",
    "creative_director",
    "compliance_officer",
    "automated_qa",
}

# Expressões de alto risco regulatório (CONAR / Meta Ads / ANVISA)
SENSITIVE_CLAIM_PATTERNS = [
    (re.compile(r"\bemagrecer\s+r[aá]pido\b", re.IGNORECASE), "Promessa de emagrecimento rápido sem respaldo clínico"),
    (re.compile(r"\bsem\s+dor(?:\s+no\s+joelho)?\b", re.IGNORECASE), "Alegação terapêutica de ausência de dor sem respaldo médico"),
    (re.compile(r"\belimin(?:am|a)\s+1\s*kg\s+toda\s+semana\b", re.IGNORECASE), "Promessa de perda quantitativa fixa de peso por semana"),
    (re.compile(r"\bderrete\s+muito\b", re.IGNORECASE), "Hipérbole desregulamentada de queima de gordura"),
    (re.compile(r"\b6\s*quilos\s+de\s+gordura\s+em\s+uma\s+semana\b", re.IGNORECASE), "Alegação extrema de perda de 6 kg de gordura em 7 dias"),
]


def scan_sensitive_claims(text: str) -> list[dict]:
    """Identifica claims literais sensíveis sujeitos a bloqueio no gerador de copy."""
    findings = []
    for pattern, reason in SENSITIVE_CLAIM_PATTERNS:
        for match in pattern.finditer(text):
            findings.append({
                "match": match.group(0),
                "start": match.start(),
                "end": match.end(),
                "reason": reason,
            })
    return findings


def sanitize_text_for_generator(text: str) -> tuple[str, list[dict]]:
    """Suprime alegações sensíveis do texto bruto antes de enviá-lo ao gerador."""
    findings = scan_sensitive_claims(text)
    if not findings:
        return text, []
    sanitized = text
    for f in sorted(findings, key=lambda x: x["start"], reverse=True):
        sanitized = (
            sanitized[:f["start"]]
            + f"[ALEGAÇÃO SENSÍVEL SUPRIMIDA - {f['reason']}]"
            + sanitized[f["end"]:]
        )
    return sanitized, findings


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_query(value: str) -> str:
    value = unicodedata.normalize("NFKD", str(value)).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "", value.lower())


class ProfileStore:
    def __init__(self, state_dir: Path):
        self.path = state_dir / "data.db"

    def connect(self) -> sqlite3.Connection:
        db = sqlite3.connect(self.path, timeout=20)
        db.execute(
            "CREATE TABLE IF NOT EXISTS tg_profile_documents ("
            "kind TEXT NOT NULL, id TEXT NOT NULL, version INTEGER NOT NULL, payload TEXT NOT NULL, "
            "PRIMARY KEY(kind,id,version))"
        )
        return db

    @contextmanager
    def transaction(self) -> Iterator[sqlite3.Connection]:
        db = self.connect()
        db.execute("BEGIN IMMEDIATE")
        try:
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def list(self, kind: str) -> list[dict]:
        with self.connect() as db:
            rows = db.execute(
                "SELECT payload FROM tg_profile_documents d WHERE kind=? "
                "AND version=(SELECT MAX(version) FROM tg_profile_documents WHERE kind=d.kind AND id=d.id) "
                "ORDER BY rowid DESC",
                (kind,),
            ).fetchall()
        return [json.loads(row[0]) for row in rows]

    def get(self, kind: str, id: str) -> dict | None:
        return next((d for d in self.list(kind) if d.get("id") == id), None)

    def get_version(self, kind: str, id: str, version: int) -> dict | None:
        with self.connect() as db:
            row = db.execute(
                "SELECT payload FROM tg_profile_documents WHERE kind=? AND id=? AND version=?",
                (kind, id, version),
            ).fetchone()
        return json.loads(row[0]) if row else None

    def history(self, kind: str, id: str) -> list[dict]:
        with self.connect() as db:
            rows = db.execute(
                "SELECT payload FROM tg_profile_documents WHERE kind=? AND id=? ORDER BY version ASC",
                (kind, id),
            ).fetchall()
        return [json.loads(r[0]) for r in rows]

    def save_in_tx(
        self, db: sqlite3.Connection, kind: str, id: str, data: dict, expected: int | None = None
    ) -> dict:
        version = db.execute(
            "SELECT COALESCE(MAX(version),0) FROM tg_profile_documents WHERE kind=? AND id=?",
            (kind, id),
        ).fetchone()[0]
        if expected is not None and expected != version:
            raise ValueError("Este conteúdo mudou. Recarregue antes de salvar.")

        if version > 0:
            last_row = db.execute(
                "SELECT payload FROM tg_profile_documents WHERE kind=? AND id=? AND version=?",
                (kind, id, version),
            ).fetchone()
            if last_row and last_row[0]:
                curr_payload = json.loads(last_row[0])
                ignore_keys = {"id", "version", "updated_at", "created_at"}
                curr_clean = {k: v for k, v in curr_payload.items() if k not in ignore_keys}
                new_clean = {k: v for k, v in data.items() if k not in ignore_keys}
                if curr_clean == new_clean:
                    return curr_payload

        payload = {**data, "id": id, "version": version + 1, "updated_at": now()}
        db.execute(
            "INSERT INTO tg_profile_documents VALUES (?,?,?,?)",
            (kind, id, version + 1, json.dumps(payload, ensure_ascii=False)),
        )
        return payload

    def save(self, kind: str, id: str, data: dict, expected: int | None = None) -> dict:
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            payload = self.save_in_tx(db, kind, id, data, expected)
        return payload

    def delete(self, kind: str, id: str | None = None) -> None:
        with self.connect() as db:
            if id is None:
                db.execute("DELETE FROM tg_profile_documents WHERE kind=?", (kind,))
            else:
                db.execute("DELETE FROM tg_profile_documents WHERE kind=? AND id=?", (kind, id))

    def resolve_alias(self, query: str) -> dict | None:
        """Resolves alias like 'AD 98' or 'mem_prod_ad98' to its canonical entity."""
        normalized = normalize_query(query)
        if not normalized:
            return None

        # Check in aliases table
        aliases = self.list("alias")
        for a in aliases:
            candidates = {
                normalize_query(a.get("id", "")),
                normalize_query(a.get("alias", "")),
                normalize_query(a.get("name", "")),
            }
            if normalized in candidates:
                target_kind = a.get("target_kind", "post")
                target_id = a.get("target_id")
                target = self.get(target_kind, target_id) if target_id else None
                return {"alias": a, "target_kind": target_kind, "target_id": target_id, "target": target}

        # Check memory items
        items = self.list("memory_item")
        for item in items:
            candidates = {
                normalize_query(str(item.get("id", ""))),
                normalize_query(str(item.get("alias", ""))),
                normalize_query(str(item.get("titulo", ""))),
            }
            if normalized in candidates or (len(normalized) >= 4 and any(normalized in c for c in candidates)):
                post_id = item.get("post_id")
                post = self.get("post", post_id) if post_id else None
                return {
                    "alias": item,
                    "target_kind": "memory_item",
                    "target_id": item.get("id"),
                    "target": item,
                    "post": post,
                }

        # Check posts directly by ID, source_url or caption tags
        posts = self.list("post")
        for p in posts:
            p_keys = {
                p.get("id", ""),
                normalize_query(p.get("id", "")),
                normalize_query(p.get("shortcode", "")),
            }
            caption = str(p.get("caption") or "")
            if normalized in p_keys or (p.get("source_url") and query in p["source_url"]) or (len(normalized) >= 4 and normalized in normalize_query(caption)):
                return {
                    "alias": {"id": p["id"], "alias": f"Post {p['id']}"},
                    "target_kind": "post",
                    "target_id": p["id"],
                    "target": p,
                    "post": p,
                }

        # Canonical graph node shortcuts
        graph_shortcuts = {
            "metodobaixoimpacto": "DauwjqVBoHh",
            "baixoimpacto": "DauwjqVBoHh",
            "desafioritbox": "Da_JAVQSCPu",
            "desafiomusical": "Da_JAVQSCPu",
            "treinonasala": "Da_JAVQSCPu",
            "ad98": "Da_JAVQSCPu",
            "post82k": "Dce8x59SSP2",
            "reel82k": "Dce8x59SSP2",
            "82k": "Dce8x59SSP2",
            "mundofit": "Da_JAVQSCPu",
            "quero": "DcUjm2eyjbC",
        }
        for g_key, target_pid in graph_shortcuts.items():
            if g_key in normalized or normalized in g_key:
                p = self.get("post", target_pid)
                if p:
                    return {
                        "alias": {"id": f"graph_{target_pid}", "alias": query.strip()},
                        "target_kind": "post",
                        "target_id": target_pid,
                        "target": p,
                        "post": p,
                    }
        return None

    def get_context_bundle(
        self, query: str, include_hypotheses: bool = False, max_hops: int = 2
    ) -> dict:
        """Builds a deterministic context_bundle for the copy generator with traceable evidence."""
        resolution = self.resolve_alias(query)
        if not resolution:
            return {
                "entity": {"query": query, "mode": "free_topic"},
                "observed_facts": [],
                "inferred_patterns": [],
                "approved_rules": [],
                "transcript_spans": [],
                "caption_spans": [],
                "metric_snapshots": [],
                "limitations": ["Tema livre sem evidência vinculada no acervo."],
                "evidence_ids": [],
            }

        target = resolution.get("target") or {}
        post = resolution.get("post") or (target if resolution.get("target_kind") == "post" else None)
        post_id = post.get("id") if post else target.get("post_id")

        all_posts = {p.get("id"): p for p in self.list("post") if p.get("id")}
        all_transcripts = {
            (t.get("post_id") or t.get("id")): t
            for t in self.list("transcript")
            if t.get("post_id") or t.get("id")
        }
        all_blocks = self.list("copy_block")
        all_relations = self.list("relation")
        all_facts = self.list("fact")
        all_hypotheses = self.list("hypothesis")
        all_snapshots = self.list("metric_snapshot")

        evidence_ids: set[str] = set()
        observed_facts: list[dict] = []
        inferred_patterns: list[dict] = []
        approved_rules: list[dict] = []
        transcript_spans: list[dict] = []
        caption_spans: list[dict] = []
        metric_snapshots: list[dict] = []
        limitations: list[str] = []

        quarantined_sensitive_blocks: list[dict] = []

        if post:
            post_id = post["id"]
            evidence_ids.add(post_id)
            if post.get("source_url"):
                evidence_ids.add(post["source_url"])

            caption = str(post.get("caption") or "").strip()
            if caption:
                # Condição 1: Não enviar legenda bruta com alegações sensíveis ao gerador
                sanitized_cap, cap_findings = sanitize_text_for_generator(caption)
                if cap_findings:
                    limitations.append(
                        f"Legenda bruta do post {post_id} continha {len(cap_findings)} alegação(ões) sensível(is) "
                        "suprimida(s) antes do envio ao gerador."
                    )
                    quarantined_sensitive_blocks.append({
                        "source_id": post_id,
                        "source_kind": "caption_raw",
                        "findings": cap_findings,
                        "action": "redacted_in_prompt",
                    })
                caption_spans.append({
                    "post_id": post_id,
                    "source_url": post.get("source_url"),
                    "text": sanitized_cap,
                    "status": "observed",
                    "had_sensitive_redaction": bool(cap_findings),
                })

            metrics = post.get("metrics") or {}
            if metrics:
                metric_snapshots.append({
                    "post_id": post_id,
                    "metrics": metrics,
                    "observed_at": post.get("observed_at"),
                    "status": "observed_reach",
                })
                limitations.append("Métricas comprovam alcance/engajamento de distribuição, NÃO conversão ou vendas.")

            if post_id not in ALLOWED_SPEECH_POSTS:
                limitations.append(
                    f"Post {post_id} possui apenas trilha sonora musical/ritmo ou ausência de mídia; não sustenta fala discursiva da criadora."
                )

            tr = all_transcripts.get(post_id)
            if tr and post_id in ALLOWED_SPEECH_POSTS:
                clean_speech = tr.get("clean") or tr.get("transcript_clean")
                if clean_speech and clean_speech != "SEM ÁUDIO DISPONÍVEL":
                    # Condição 1: Não enviar transcrição bruta com alegações sensíveis ao gerador
                    sanitized_speech, speech_findings = sanitize_text_for_generator(clean_speech)
                    if speech_findings:
                        limitations.append(
                            f"Transcrição bruta do post {post_id} continha {len(speech_findings)} alegação(ões) sensível(is) "
                            "suprimida(s) antes do envio ao gerador."
                        )
                        quarantined_sensitive_blocks.append({
                            "source_id": post_id,
                            "source_kind": "transcript_raw",
                            "findings": speech_findings,
                            "action": "redacted_in_prompt",
                        })
                    transcript_spans.append({
                        "post_id": post_id,
                        "text": sanitized_speech,
                        "model": tr.get("model_name", "faster-whisper"),
                        "status": "observed",
                        "had_sensitive_redaction": bool(speech_findings),
                    })

        for b in all_blocks:
            if b.get("post_id") == post_id or b.get("id") in evidence_ids:
                status = b.get("status", "observed")
                if status == "hypothesis" and not include_hypotheses:
                    continue
                if status in {"blocked", "unsupported"}:
                    continue

                # Bloqueio estrito de copy_block com alegação sensível
                if b.get("policy_status") == "blocked_from_generator" or b.get("is_sensitive"):
                    quarantined_sensitive_blocks.append({
                        "block_id": b.get("id"),
                        "source_id": b.get("post_id"),
                        "source_kind": b.get("source_kind"),
                        "literal_text": b.get("literal_text"),
                        "policy_reason": b.get("policy_reason", "Claim sensível de saúde"),
                        "action": "excluded_from_generator_prompt",
                    })
                    continue

                evidence_ids.add(b["id"])
                if b.get("source_kind") in {"transcript", "speech"} and post_id in ALLOWED_SPEECH_POSTS:
                    transcript_spans.append({
                        "block_id": b["id"],
                        "role": b.get("role"),
                        "text": b.get("literal_text"),
                        "status": status,
                    })
                elif b.get("source_kind") in {"caption", "visual"}:
                    caption_spans.append({
                        "block_id": b["id"],
                        "role": b.get("role"),
                        "text": b.get("literal_text"),
                        "status": status,
                    })

        related_ids = {post_id, target.get("id")} - {None}
        for hop in range(max_hops):
            new_ids = set()
            for r in all_relations:
                if r.get("source_id") in related_ids:
                    new_ids.add(r.get("target_id"))
                    evidence_ids.update(r.get("source_ids") or [])
                elif r.get("target_id") in related_ids:
                    new_ids.add(r.get("source_id"))
                    evidence_ids.update(r.get("source_ids") or [])
            related_ids.update(new_ids - {None})

        for f in all_facts:
            if f.get("id") in related_ids or f.get("post_id") == post_id:
                status = f.get("status", "observed")
                if status in {"blocked", "unsupported"}:
                    continue
                if status == "hypothesis" and not include_hypotheses:
                    continue
                evidence_ids.add(f["id"])
                if status == "observed":
                    observed_facts.append(f)
                else:
                    inferred_patterns.append(f)

        if include_hypotheses:
            for h in all_hypotheses:
                if h.get("id") in related_ids:
                    inferred_patterns.append({**h, "status": "hypothesis"})

        return {
            "entity": {
                "query": query,
                "alias": target.get("alias") or query,
                "post_id": post_id,
                "target_kind": resolution.get("target_kind"),
                "status": target.get("status_de_evidencia", "observed"),
            },
            "observed_facts": observed_facts,
            "inferred_patterns": inferred_patterns,
            "approved_rules": approved_rules,
            "transcript_spans": transcript_spans,
            "caption_spans": caption_spans,
            "quarantined_sensitive_blocks": quarantined_sensitive_blocks,
            "metric_snapshots": metric_snapshots,
            "limitations": limitations,
            "evidence_ids": sorted(evidence_ids),
        }

    def get_coverage_summary(self) -> dict:
        """Returns accurate dynamic KPIs calculated strictly from stored records."""
        posts = self.list("post")
        blocks = self.list("copy_block")
        memory_items = self.list("memory_item")
        relations = self.list("relation")
        validation_events = self.list("validation_event")

        posts_total = len(posts)
        media_files_total = sum(1 for p in posts if p.get("media_file"))
        useful_speech_total = sum(1 for p in posts if p.get("id") in ALLOWED_SPEECH_POSTS and p.get("media_file"))
        blocked_no_media = sum(1 for p in posts if not p.get("media_file"))
        music_no_speech_total = sum(
            1 for p in posts if p.get("media_file") and p.get("id") not in ALLOWED_SPEECH_POSTS
        )

        observed_count = sum(1 for m in memory_items if m.get("status_de_evidencia") == "observado")
        inferred_count = sum(1 for m in memory_items if m.get("status_de_evidencia") == "inferido")
        hypothesis_count = sum(1 for m in memory_items if m.get("status_de_evidencia") == "hipotese")
        blocked_count = sum(1 for m in memory_items if m.get("status_de_evidencia") in {"bloqueado", "unsupported"})

        # Regra Estrita: client_approved_total exige prova em validation_event
        proven_client_approved_ids = {
            e.get("target_id")
            for e in validation_events
            if e.get("event_type") == "client_approval"
        }
        client_approved_count = sum(
            1 for m in memory_items
            if m.get("status_de_validacao") in {"aprovado", "client_approved"}
            and m.get("id") in proven_client_approved_ids
        )

        proven_commercial_ids = {
            e.get("target_id")
            for e in validation_events
            if e.get("event_type") == "commercial_validation"
        }
        commercially_validated_count = sum(
            1 for m in memory_items
            if m.get("status_de_validacao") == "commercially_validated"
            and (m.get("id") in proven_commercial_ids or m.get("metricas", {}).get("conversoes"))
        )

        sem_validacao_count = sum(
            1 for m in memory_items
            if m.get("id") not in proven_client_approved_ids and m.get("id") not in proven_commercial_ids
        )

        sensitive_claims_blocked = sum(
            1 for b in blocks if b.get("policy_status") == "blocked_from_generator" or b.get("is_sensitive")
        )

        return {
            "posts_total": posts_total,
            "media_files_total": media_files_total,
            "useful_speech_total": useful_speech_total,
            "blocked_no_media_total": blocked_no_media,
            "music_no_speech_total": music_no_speech_total,
            "copy_blocks_total": len(blocks),
            "relations_total": len(relations),
            "memory_items_total": len(memory_items),
            "observed_items_total": observed_count,
            "inferred_items_total": inferred_count,
            "hypotheses_total": hypothesis_count,
            "blocked_items_total": blocked_count,
            "validation_events_total": len(validation_events),
            "client_approved_total": client_approved_count,
            "commercially_validated_total": commercially_validated_count,
            "sem_validacao_total": sem_validacao_count,
            "sensitive_claims_blocked_total": sensitive_claims_blocked,
        }


def validate_copy_block(
    block: dict,
    allowed_speech_posts: set[str] = ALLOWED_SPEECH_POSTS,
    posts_lookup: dict[str, dict] | None = None,
    transcripts_lookup: dict[str, dict] | None = None,
) -> None:
    required_keys = {"id", "post_id", "source_kind", "literal_text", "role", "status", "source_ids"}
    missing = required_keys - set(block.keys())
    if missing:
        raise ValueError(f"Bloco de copy incompleto. Campos ausentes: {sorted(missing)}")

    source_ids = block.get("source_ids")
    if not isinstance(source_ids, list) or len(source_ids) == 0:
        raise ValueError("Bloco de copy exige 'source_ids' com pelo menos um identificador de origem.")

    post_id = block["post_id"]
    source_kind = block["source_kind"]
    literal_text = str(block["literal_text"]).strip()

    if source_kind in {"transcript", "speech"}:
        if post_id not in allowed_speech_posts:
            raise ValueError(
                f"Apenas os posts {sorted(allowed_speech_posts)} possuem fala auditada para sustentar "
                f"blocos de fala. O post {post_id} sustenta apenas legenda ou formato visual."
            )
        start_sec = block.get("start_sec")
        end_sec = block.get("end_sec")
        if start_sec is None or end_sec is None:
            raise ValueError(
                f"Bloco de fala '{block['id']}' exige timestamps 'start_sec' e 'end_sec'."
            )
        try:
            start_sec = float(start_sec)
            end_sec = float(end_sec)
        except (ValueError, TypeError):
            raise ValueError("Timestamps 'start_sec' e 'end_sec' devem ser números.")
        if start_sec < 0 or end_sec <= start_sec:
            raise ValueError(
                f"Intervalo de timestamps inválido para bloco de fala: {start_sec}s -> {end_sec}s."
            )

        # Condição 2: Verificação contra áudio/transcrição real
        if transcripts_lookup is not None:
            if post_id not in transcripts_lookup:
                raise ValueError("Transcrição de origem ausente; não é possível validar a fala.")
            tr = transcripts_lookup[post_id]
            segments = tr.get("segments", [])
            matching = [
                s for s in segments
                if (float(s.get("start", 0)) < end_sec and float(s.get("end", 0)) > start_sec)
            ]
            if not matching:
                raise ValueError(
                    f"Timestamps {start_sec}s - {end_sec}s não coincidem com nenhum segmento da transcrição de {post_id}."
                )
            if start_sec < min(float(s["start"]) for s in matching) or end_sec > max(float(s["end"]) for s in matching):
                raise ValueError("Intervalo excede os segmentos de origem da fala.")
            source_text = " ".join(str(s.get("text", "")) for s in matching)
            normalize = lambda value: " ".join(value.split())
            if not literal_text or normalize(literal_text) not in normalize(source_text):
                raise ValueError("Texto literal diverge dos segmentos de origem da fala.")

    elif source_kind == "caption":
        start_char = block.get("start_char")
        end_char = block.get("end_char")
        if start_char is None or end_char is None:
            raise ValueError(
                f"Bloco de legenda '{block['id']}' exige offsets 'start_char' e 'end_char'."
            )
        try:
            start_char = int(start_char)
            end_char = int(end_char)
        except (ValueError, TypeError):
            raise ValueError("Offsets 'start_char' e 'end_char' devem ser números inteiros.")
        if start_char < 0 or end_char <= start_char:
            raise ValueError(
                f"Intervalo de offsets inválido para bloco de legenda: [{start_char}:{end_char}]."
            )

        # Condição 2: Verificação contra legenda real do post
        if posts_lookup is not None:
            if post_id not in posts_lookup:
                raise ValueError("Post de origem ausente; não é possível validar a legenda.")
            raw_caption = posts_lookup[post_id].get("caption") or ""
            actual_span = raw_caption[start_char:end_char].strip()
            if actual_span != literal_text:
                raise ValueError(
                    f"Offsets [{start_char}:{end_char}] divergem da legenda real de {post_id}. "
                    f"Real: {actual_span!r} != Declarado: {literal_text!r}"
                )

    if block["status"] not in VALID_STATUSES:
        raise ValueError(f"Status de evidência inválido: '{block['status']}'. Permitidos: {sorted(VALID_STATUSES)}")

    if block["role"] not in VALID_ROLES:
        raise ValueError(f"Papel retórico inválido: '{block['role']}'. Permitidos: {sorted(VALID_ROLES)}")

    # Classificação de compliance / claims sensíveis
    claims = scan_sensitive_claims(literal_text)
    if claims:
        block["is_sensitive"] = True
        block["policy_status"] = "blocked_from_generator"
        block["policy_risk"] = "high"
        block["policy_reason"] = "; ".join(c["reason"] for c in claims)
    else:
        block.setdefault("is_sensitive", False)
        block.setdefault("policy_status", "allowed")
        block.setdefault("policy_risk", "low")
        block.setdefault("policy_reason", "")


def validate_validation_event(evt: dict) -> None:
    required_keys = {
        "id",
        "target_kind",
        "target_id",
        "event_type",
        "approver_name",
        "approver_role",
        "channel",
        "evidence_ref",
        "timestamp",
        "notes",
    }
    missing = required_keys - set(evt.keys())
    if missing:
        raise ValueError(f"Evento de validação incompleto. Campos ausentes: {sorted(missing)}")

    if evt["event_type"] not in VALID_EVENT_TYPES:
        raise ValueError(
            f"Tipo de evento de validação inválido: '{evt['event_type']}'. Permitidos: {sorted(VALID_EVENT_TYPES)}"
        )
    if evt["approver_role"] not in VALID_APPROVER_ROLES:
        raise ValueError(
            f"Papel de aprovador inválido: '{evt['approver_role']}'. Permitidos: {sorted(VALID_APPROVER_ROLES)}"
        )


def validate_relation(rel: dict, existing_ids: set[str] | None = None) -> None:
    required_keys = {"source_id", "target_id", "relation_type", "status"}
    missing = required_keys - set(rel.keys())
    if missing:
        raise ValueError(f"Relação incompleta. Campos ausentes: {sorted(missing)}")

    rel_type = rel["relation_type"]
    if rel_type not in ALLOWED_RELATION_TYPES:
        raise ValueError(f"Tipo de relação desconhecido: '{rel_type}'. Permitidos: {sorted(ALLOWED_RELATION_TYPES)}")

    source_id = rel["source_id"]
    target_id = rel["target_id"]

    if source_id == target_id:
        raise ValueError(
            f"Relação reflexiva proibida: '{source_id}' não pode apontar para si mesmo."
        )

    source_ids = rel.get("source_ids")
    if not source_ids:
        raise ValueError(f"Relação {rel_type} rejeitada: toda relação exige source_ids rastreáveis.")

    if existing_ids is not None:
        if source_id not in existing_ids:
            raise ValueError(
                f"Referência órfã detectada na relação {rel_type}: origem '{source_id}' não existe no acervo."
            )
        if target_id not in existing_ids:
            raise ValueError(
                f"Referência órfã detectada na relação {rel_type}: destino '{target_id}' não existe no acervo."
            )


def validate_blocks(text: str, blocks: list[dict]) -> None:
    if not blocks or "".join(b["text"] for b in blocks) != text:
        raise ValueError(
            "Os blocos precisam preservar integralmente o texto de origem, na mesma ordem."
        )
    ids = [b["id"] for b in blocks]
    if len(set(ids)) != len(ids):
        raise ValueError("Cada bloco precisa de um identificador exclusivo.")


def compose_locked(blocks: list[dict], replacements: dict[str, str]) -> str:
    allowed = {b["id"] for b in blocks if not b["locked"]}
    if set(replacements) != allowed or any(
        not isinstance(t, str) or not t.strip() for t in replacements.values()
    ):
        raise ValueError(
            "A IA não respeitou os blocos liberados. Nenhuma copy foi salva."
        )
    return "".join(b["text"] if b["locked"] else replacements[b["id"]] for b in blocks)


def parse_json(text: str) -> Any:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(text)


def transcribe(path: Path, model: str = "small") -> dict:
    import av
    from faster_whisper import WhisperModel

    with av.open(str(path)) as media:
        if not media.streams.audio:
            raise ValueError(
                "O arquivo não contém áudio. Envie o vídeo com a faixa de áudio."
            )
    engine = WhisperModel(model, device="cpu", compute_type="int8", cpu_threads=4)
    segments, info = engine.transcribe(
        str(path),
        language="pt",
        vad_filter=True,
        word_timestamps=True,
        condition_on_previous_text=False,
    )
    result = [
        {
            "start": s.start,
            "end": s.end,
            "text": s.text,
            "words": [
                {
                    "start": w.start,
                    "end": w.end,
                    "word": w.word,
                    "probability": w.probability,
                }
                for w in (s.words or [])
            ],
        }
        for s in segments
    ]
    return {
        "text": "".join(s["text"] for s in result),
        "segments": result,
        "duration": info.duration,
        "model": model,
        "engine": "faster-whisper",
        "reviewed": False,
        "warning": "Transcrição automática: música e vozes de terceiros não comprovam a fala da cliente.",
    }
