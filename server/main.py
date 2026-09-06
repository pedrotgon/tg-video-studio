"""Gateway real do TG Video Studio para MoneyPrinterTurbo e DramaClaw."""

from urllib.parse import quote, urljoin
import json
import re
import unicodedata
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

MONEY_API = "http://127.0.0.1:8080"
DRAMA_API = "http://127.0.0.1:8780"
app = FastAPI(title="TG Video Studio Gateway", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


class SimpleVideoRequest(BaseModel):
    videoSubject: str = Field(min_length=1, max_length=500)
    videoScript: str | None = Field(default=None, max_length=8000)
    tone: str = "direto"
    keywords: str | None = Field(default=None, max_length=1000)
    voiceName: str = "pt-BR-FranciscaNeural"
    videoRatio: str = "9:16"
    subtitleEnabled: bool = True
    subtitlePosition: str = "bottom"


class SimpleScriptRequest(BaseModel):
    videoSubject: str = Field(min_length=1, max_length=500)
    tone: str = Field(default="direto", max_length=40)


class SimpleCopiesRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    projectId: str = Field(min_length=1, max_length=160)
    targetCta: str = Field(default="MUNDOFIT", max_length=100)
    answers: dict[str, str] = Field(default_factory=dict)


class ComplexVideoRequest(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    storyPremise: str = Field(min_length=1, max_length=8000)
    genre: str = "drama"
    characters: list[dict] = []
    scenes: list[dict] = []


async def get_json(url: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=503, detail=f"Motor indisponível: {exc}") from exc


def normalized_key(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "", value.lower())


async def profile_data(project_id: str) -> dict:
    result = await get_json(f"{DRAMA_API}/api/v1/projects/{project_id}/profile")
    return result.get("data") or {}


def resolve_verified_memory(data: dict, query: str) -> dict | None:
    if not query or not query.strip():
        return None
    key = normalized_key(query)
    if not key:
        return None

    items = data.get("memory_items") or []
    posts = data.get("posts") or []
    relations = data.get("relations") or []
    by_post_id = {p.get("id"): p for p in posts if p.get("id")}

    # 1. Busca exata ou por candidatos em memory_items
    exact_items = [
        item for item in items
        if key in {
            normalized_key(str(item.get("id", ""))),
            normalized_key(str(item.get("alias", ""))),
            normalized_key(str(item.get("titulo", ""))),
        }
    ]
    candidate_items = exact_items or [
        item for item in items
        if key in normalized_key(f"{item.get('id', '')} {item.get('alias', '')} {item.get('titulo', '')}")
    ]

    selected_item = None
    resolved_post = None

    for candidate in candidate_items:
        if candidate.get("status_de_evidencia") in {"bloqueado", "unsupported"}:
            continue
        pid = candidate.get("post_id")
        if pid and pid in by_post_id:
            selected_item = candidate
            resolved_post = by_post_id[pid]
            break
        # Se não tem post_id direto, busca via relações de grafos
        cid = candidate.get("id")
        for rel in relations:
            sid = rel.get("source_id")
            tid = rel.get("target_id")
            if sid == cid or tid == cid:
                other_id = tid if sid == cid else sid
                if other_id in by_post_id:
                    selected_item = candidate
                    resolved_post = by_post_id[other_id]
                    break
        if selected_item and resolved_post:
            break

    # 2. Se não encontrou em memory_items, busca direto nas postagens por ID, shortcode ou tag/hashtag na legenda
    if not resolved_post:
        for p in posts:
            p_keys = {
                normalized_key(str(p.get("id", ""))),
                normalized_key(str(p.get("shortcode", ""))),
            }
            caption = str(p.get("caption") or "")
            norm_cap = normalized_key(caption)
            if key in p_keys or (len(key) >= 4 and key in norm_cap):
                resolved_post = p
                matched_m = next((m for m in items if m.get("post_id") == p.get("id")), None)
                selected_item = matched_m or {
                    "id": f"mem_post_{p.get('id')}",
                    "alias": f"Post {p.get('id')}",
                    "status_de_evidencia": "observado",
                    "status_de_validacao": "validado",
                }
                break

    # 3. Se ainda não resolveu, busca nós canônicos do grafo de memória
    if not resolved_post:
        graph_node_map = {
            "metodobaixoimpacto": "DauwjqVBoHh",
            "baixoimpacto": "DauwjqVBoHh",
            "desafioritbox": "Da_JAVQSCPu",
            "desafiomusical": "Da_JAVQSCPu",
            "treinonasala": "Da_JAVQSCPu",
            "treinonadecasa": "Da_JAVQSCPu",
            "ad98": "Da_JAVQSCPu",
            "post82k": "Dce8x59SSP2",
            "reel82k": "Dce8x59SSP2",
            "82k": "Dce8x59SSP2",
            "mundofit": "Da_JAVQSCPu",
            "quero": "DcUjm2eyjbC",
        }
        for g_key, target_pid in graph_node_map.items():
            if g_key in key or key in g_key:
                if target_pid in by_post_id:
                    resolved_post = by_post_id[target_pid]
                    matched_m = next((m for m in items if m.get("post_id") == target_pid), None)
                    selected_item = matched_m or {
                        "id": f"mem_graph_{target_pid}",
                        "alias": query.strip(),
                        "status_de_evidencia": "observado",
                        "status_de_validacao": "validado",
                    }
                    break

    if not resolved_post or not selected_item:
        return None

    post_id = resolved_post.get("id")
    source_url = resolved_post.get("source_url") or f"https://www.instagram.com/p/{post_id}/"
    caption = str(resolved_post.get("caption") or "").strip()

    return {
        "id": selected_item.get("id"),
        "alias": selected_item.get("alias") or f"Post {post_id}",
        "post_id": post_id,
        "source_url": source_url,
        "caption": caption,
        "metrics": resolved_post.get("metrics") or {},
        "observed_at": resolved_post.get("observed_at") or selected_item.get("observado_em"),
        "status_de_evidencia": selected_item.get("status_de_evidencia", "observado"),
        "status_de_validacao": selected_item.get("status_de_validacao", "sem_validacao"),
    }


@app.get("/api/health")
async def health_check():
    async def probe(url: str) -> bool:
        try:
            async with httpx.AsyncClient(timeout=2) as client:
                return (await client.get(url)).status_code < 500
        except httpx.HTTPError:
            return False
    money = await probe(f"{MONEY_API}/ping")
    drama = await probe(f"{DRAMA_API}/healthz")
    return {"status": "online" if money and drama else "partial", "engines": {"money_printer_turbo": money, "drama_claw": drama}}


@app.post("/api/simple/copies", status_code=202)
async def generate_simple_copies(body: SimpleCopiesRequest):
    if len(body.answers) > 5 or any(len(key) > 80 or len(value) > 80 for key, value in body.answers.items()):
        raise HTTPException(status_code=422, detail="A qualificação contém respostas inválidas.")
    data = await profile_data(body.projectId)
    memory = resolve_verified_memory(data, body.query)
    if memory:
        source = {
            "consulta": body.query,
            "referencia": memory["alias"],
            "post_id": memory["post_id"],
            "fonte": memory["source_url"],
            "legenda_observada": memory["caption"],
            "metricas_observadas": memory["metrics"],
            "observado_em": memory["observed_at"],
            "restricao": "Use apenas a legenda como linguagem observada. Métricas não provam conversão, retenção ou causalidade.",
            "direcionamento_confirmado": body.answers,
        }
    else:
        source = {
            "tema_informado": body.query,
            "restricao": "Tema livre sem evidência vinculada. Não invente prova, resultado, depoimento ou dado da cliente.",
            "direcionamento_confirmado": body.answers,
        }
    try:
        # Gemini with high reasoning may legitimately take longer than a
        # lightweight draft.  Do not turn a live model response into a false
        # failure while the copy job is still being composed.
        async with httpx.AsyncClient(timeout=240) as client:
            response = await client.post(
                f"{DRAMA_API}/api/v1/projects/{body.projectId}/profile/strategic-copies",
                json={
                    "input_text": json.dumps(source, ensure_ascii=False),
                    "source_post_id": memory["post_id"] if memory else None,
                    "target_cta": body.targetCta,
                    "fast": True,
                },
            )
            response.raise_for_status()
            result = response.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail=f"O gerador de copies recusou a solicitação: {exc.response.text[:500]}") from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=503, detail=f"Gerador de copies indisponível: {exc}") from exc
    job = result.get("data") or {}
    return {"id": job.get("id"), "memory": memory, "status": job.get("status", "running")}


@app.post("/api/simple/copies/qualify")
async def qualify_simple_copy(body: SimpleCopiesRequest):
    data = await profile_data(body.projectId)
    memory = resolve_verified_memory(data, body.query)
    try:
        context_bundle = await get_json(
            f"{DRAMA_API}/api/v1/projects/{body.projectId}/profile/context?query={quote(body.query)}"
        )
        # The qualification uses the same high-reasoning text provider as the
        # copy job.  Keep the gateway timeout aligned with that provider.
        async with httpx.AsyncClient(timeout=240) as client:
            response = await client.post(
                f"{DRAMA_API}/api/v1/projects/{body.projectId}/profile/qualify",
                json={
                    "query": body.query,
                    "target_cta": body.targetCta,
                    "context_bundle": context_bundle.get("data") or {},
                },
            )
            response.raise_for_status()
            result = (response.json().get("data") or {})
    except httpx.HTTPStatusError as exc:
        try:
            detail = str(exc.response.json().get("detail") or "")
        except ValueError:
            detail = ""
        safe_detail = detail if detail.startswith("BLOQUEIO EXTERNO:") else "A IA não conseguiu montar perguntas válidas agora."
        raise HTTPException(status_code=exc.response.status_code, detail=safe_detail) from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=503, detail=f"Qualificação estratégica indisponível: {exc}") from exc
    return {**result, "memory": memory}


@app.post("/api/simple/memory/resolve")
async def resolve_simple_memory(body: SimpleCopiesRequest):
    data = await profile_data(body.projectId)
    memory = resolve_verified_memory(data, body.query)
    return {"memory": memory, "mode": "verified_memory" if memory else "free_topic"}


@app.get("/api/simple/copies/{job_id}")
async def get_simple_copies(job_id: str, projectId: str):
    data = await profile_data(projectId)
    job = next((item for item in data.get("jobs") or [] if item.get("id") == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Tarefa de copies não encontrada.")
    response = {"id": job_id, "status": job.get("status"), "error": job.get("error")}
    if job.get("status") == "completed":
        copy_ids = (job.get("result") or {}).get("copy_ids") or []
        by_id = {copy.get("id"): copy for copy in data.get("copies") or []}
        response["copies"] = [by_id[copy_id] for copy_id in copy_ids if copy_id in by_id]
    return response


@app.post("/api/simple/script")
async def generate_simple_script(body: SimpleScriptRequest):
    """Gera um rascunho real para revisão antes de criar o vídeo."""
    payload = {
        "video_subject": body.videoSubject,
        "video_language": "pt-BR",
        "paragraph_number": 3,
        "video_script_prompt": (
            f"Escreva um roteiro comercial curto para vídeo vertical em pt-BR, com tom {body.tone}. "
            "Use gancho, benefício verificável, demonstração simples e CTA claro. "
            "Não invente preço, números, depoimentos ou garantias. Retorne apenas "
            "o texto narrado, em parágrafos curtos."
        ),
    }
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(f"{MONEY_API}/api/v1/scripts", json=payload)
            response.raise_for_status()
            result = response.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"O motor de IA recusou o roteiro: {exc.response.text[:800]}") from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=503, detail=f"Motor de IA indisponível: {exc}") from exc
    script = (result.get("data") or {}).get("video_script")
    if (
        not isinstance(script, str)
        or not script.strip()
        or script.lstrip().lower().startswith(("error:", "erro:"))
    ):
        raise HTTPException(
            status_code=503,
            detail="A IA não conseguiu gerar o roteiro agora. Aguarde alguns segundos e tente novamente.",
        )
    return {"script": script.strip()}


@app.post("/api/simple/generate", status_code=202)
async def generate_simple(body: SimpleVideoRequest):
    voice_map = {
        "pt-BR-FabioNeural": "pt-BR-AntonioNeural",
        "pt-BR-ThalitaNeural": "pt-BR-ThalitaMultilingualNeural",
    }
    voice = voice_map.get(body.voiceName, body.voiceName) or "pt-BR-FranciscaNeural"
    payload = {
        "video_subject": body.videoSubject,
        "video_script": body.videoScript or "",
        "video_terms": body.keywords or "home workout, bodyweight exercise, core workout, fitness at home, healthy lifestyle",
        "video_aspect": body.videoRatio,
        "video_language": "pt-BR",
        "voice_name": voice,
        "subtitle_enabled": body.subtitleEnabled,
        "subtitle_position": body.subtitlePosition,
        "video_source": "pexels",
        "video_count": 1,
        "video_transition_mode": "Shuffle",
        "video_clip_duration": 4,
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(f"{MONEY_API}/api/v1/videos", json=payload)
            response.raise_for_status()
            result = response.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"MoneyPrinterTurbo recusou a tarefa: {exc.response.text[:800]}") from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=503, detail=f"MoneyPrinterTurbo indisponível: {exc}") from exc
    task_id = (result.get("data") or {}).get("task_id")
    if not task_id:
        raise HTTPException(status_code=502, detail="MoneyPrinterTurbo não retornou task_id")
    return {"id": task_id, "status": "generating_script", "progress": 0}


@app.get("/api/simple/tasks/{task_id}")
async def get_simple_task(task_id: str):
    result = await get_json(f"{MONEY_API}/api/v1/tasks/{task_id}")
    task = result.get("data") or {}
    state, progress = int(task.get("state", 4)), int(task.get("progress", 0))
    # `videos` are the authored outputs with voice, music and subtitles.
    # `combined_videos` are only intermediate visual assemblies.
    videos = task.get("videos") or task.get("combined_videos") or []
    video_url = videos[-1] if videos else None
    if video_url and video_url.startswith("/"):
        video_url = urljoin(f"{MONEY_API}/", video_url.lstrip("/"))
    if state == -1:
        status = "error"
    elif state == 1:
        status = "completed"
    elif progress < 20:
        status = "generating_script"
    elif progress < 40:
        status = "rendering_audio"
    elif progress < 60:
        status = "fetching_media"
    else:
        status = "compositing"
    messages = {"generating_script": "Criando roteiro com IA…", "rendering_audio": "Gerando narração em português…", "fetching_media": "Selecionando mídia…", "compositing": "Compondo vídeo e legendas…", "completed": "Vídeo pronto.", "error": "A geração encontrou um erro."}
    return {"id": task_id, "status": status, "progress": 100 if status == "completed" else progress, "currentStepMessage": messages[status], "videoUrl": video_url, "error": task.get("error") or task.get("failed_stage")}


@app.post("/api/complex/projects", status_code=201)
async def create_cinema_project(body: ComplexVideoRequest):
    normalized = unicodedata.normalize("NFKD", body.title).encode("ascii", "ignore").decode("ascii")
    project_name = re.sub(r"[^A-Za-z0-9]+", "_", normalized).strip("_")[:120]
    if not project_name:
        raise HTTPException(status_code=422, detail="O título não gerou um identificador de projeto válido")
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(f"{DRAMA_API}/api/v1/projects", json={"name": project_name})
            response.raise_for_status()
            result = response.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=exc.response.text[:800]) from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=503, detail=f"DramaClaw indisponível: {exc}") from exc
    project = result.get("data") or {}
    project_id = project.get("project_id") or project.get("id")
    return {"id": project_id, "title": body.title, "status": "completed", "progress": 100, "currentStepMessage": "Produção criada no TG Criatividade.", "studioUrl": f"http://127.0.0.1:5174/projects/{project_id}/ingest?lng=pt&embedded=true"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
