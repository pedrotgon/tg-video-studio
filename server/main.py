"""Gateway real do TG Video Studio para MoneyPrinterTurbo e DramaClaw."""

from urllib.parse import urljoin
from pathlib import Path
import re
import unicodedata
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

MONEY_API = "http://127.0.0.1:8080"
DRAMA_API = "http://127.0.0.1:8780"
DEMO_VIDEO = Path(__file__).resolve().parents[1] / "engines" / "moneyprinter" / "storage" / "tasks" / "26cff4ec-6d38-4653-a148-81e8546da3e8" / "final-1.mp4"

app = FastAPI(title="TG Video Studio Gateway", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


class SimpleVideoRequest(BaseModel):
    videoSubject: str = Field(min_length=1, max_length=500)
    videoScript: str | None = Field(default=None, max_length=8000)
    keywords: str | None = Field(default=None, max_length=1000)
    voiceName: str = "pt-BR-FranciscaNeural"
    videoRatio: str = "9:16"
    subtitleEnabled: bool = True
    subtitlePosition: str = "bottom"


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


@app.get("/api/demo/roma-antiga.mp4", include_in_schema=False)
async def demo_video():
    """Serve a renderização real aprovada usada nas demonstrações comerciais."""
    if not DEMO_VIDEO.is_file() or DEMO_VIDEO.stat().st_size == 0:
        raise HTTPException(status_code=404, detail="Vídeo demonstrativo não encontrado")
    return FileResponse(DEMO_VIDEO, media_type="video/mp4", filename="tg-video-studio-roma-antiga.mp4")


@app.post("/api/simple/generate", status_code=202)
async def generate_simple(body: SimpleVideoRequest):
    payload = {
        "video_subject": body.videoSubject,
        "video_script": body.videoScript or "",
        "video_terms": body.keywords or "home workout, bodyweight exercise, core workout, fitness at home, healthy lifestyle",
        "video_aspect": body.videoRatio,
        "video_language": "pt-BR",
        "voice_name": body.voiceName,
        "subtitle_enabled": body.subtitleEnabled,
        "subtitle_position": body.subtitlePosition,
        "video_source": "pexels",
        "video_count": 1,
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
