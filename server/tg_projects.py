"""TG-owned project storage. No production-engine dependency."""
import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/tg/projects", tags=["TG Criativo"])


def directory():
    path = Path(os.environ.get("TG_DATA_DIR", Path(__file__).parent.parent / ".runtime" / "tg"))
    path.mkdir(parents=True, exist_ok=True)
    return path


@contextmanager
def database():
    db = sqlite3.connect(directory() / "projects.sqlite", timeout=15)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    db.executescript("""
        CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY, title TEXT NOT NULL, client TEXT NOT NULL, library TEXT);
        CREATE TABLE IF NOT EXISTS creatives(id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), title TEXT NOT NULL, sequence TEXT, revision INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS exports(id TEXT PRIMARY KEY, creative_id TEXT NOT NULL REFERENCES creatives(id), format TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    """)
    try:
        yield db
        db.commit()
    finally:
        db.close()


def require_project(db, project):
    row = db.execute("SELECT * FROM projects WHERE id=?", (project,)).fetchone()
    if not row:
        raise HTTPException(404, "Projeto não encontrado.")
    return row


def require_creative(db, project, creative):
    row = db.execute("SELECT * FROM creatives WHERE id=? AND project_id=?", (creative, project)).fetchone()
    if not row:
        raise HTTPException(404, "Criativo não encontrado neste projeto.")
    return row


class NewProject(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    client: str = Field(default="", max_length=160)


class NewCreative(BaseModel):
    title: str = Field(min_length=1, max_length=120)


class SequenceUpdate(BaseModel):
    revision: int = Field(ge=0)
    sequence: dict


@router.get("")
def list_projects():
    with database() as db:
        return [dict(row) for row in db.execute("SELECT id,title,client FROM projects ORDER BY rowid DESC")]


@router.post("", status_code=201)
def create_project(body: NewProject):
    title = body.title.strip()
    if not title:
        raise HTTPException(422, "Informe o nome do projeto.")
    result = {"id": str(uuid4()), "title": title, "client": body.client.strip()}
    with database() as db:
        db.execute("INSERT INTO projects(id,title,client) VALUES(:id,:title,:client)", result)
    return result


@router.get("/{project}/creatives")
def list_creatives(project: str):
    with database() as db:
        require_project(db, project)
        return [dict(row) for row in db.execute("SELECT id,title,revision FROM creatives WHERE project_id=? ORDER BY rowid DESC", (project,))]


@router.post("/{project}/creatives", status_code=201)
def create_creative(project: str, body: NewCreative):
    if not body.title.strip():
        raise HTTPException(422, "Informe o nome do criativo.")
    result = {"id": str(uuid4()), "title": body.title.strip(), "revision": 0}
    with database() as db:
        require_project(db, project)
        db.execute("INSERT INTO creatives(id,project_id,title) VALUES(?,?,?)", (result["id"], project, result["title"]))
    return result


@router.get("/{project}/creatives/{creative}")
def get_creative(project: str, creative: str):
    with database() as db:
        row = require_creative(db, project, creative)
        parent = require_project(db, project)
        return {"title": row["title"], "revision": row["revision"], "sequence": json.loads(row["sequence"]) if row["sequence"] else None, "library": json.loads(parent["library"]) if parent["library"] else None, "client": parent["client"]}


@router.put("/{project}/creatives/{creative}")
def save_sequence(project: str, creative: str, body: SequenceUpdate):
    state = body.sequence
    if state.get("version") != 1 or not isinstance(state.get("frames"), list) or len(state["frames"]) > 240:
        raise HTTPException(422, "Sequência de animação inválida.")
    encoded = json.dumps(state, ensure_ascii=False)
    if len(encoded.encode()) > 40 * 1024 * 1024:
        raise HTTPException(413, "O projeto excede 40 MB.")
    title = state.get("title")
    if not isinstance(title, str) or not title.strip() or len(title) > 120:
        raise HTTPException(422, "Informe um título com até 120 caracteres.")
    with database() as db:
        require_creative(db, project, creative)
        changed = db.execute("UPDATE creatives SET sequence=?,title=?,revision=revision+1 WHERE id=? AND project_id=? AND revision=?", (encoded, title, creative, project, body.revision))
        if changed.rowcount != 1:
            raise HTTPException(409, "Este criativo foi alterado em outra aba. Baixe seu projeto antes de recarregar para comparar as versões.")
    return {"revision": body.revision + 1}


@router.post("/{project}/creatives/{creative}/elements")
def save_elements(project: str, creative: str):
    with database() as db:
        row = require_creative(db, project, creative)
        if not row["sequence"]:
            raise HTTPException(409, "Salve o criativo antes de guardar seus elementos.")
        state = json.loads(row["sequence"])
        library = {key: state.get(key) for key in ("backdrop", "background", "audio", "audioName")}
        library["actors"] = state.get("scene", {}).get("actors", [])
        db.execute("UPDATE projects SET library=? WHERE id=?", (json.dumps(library), project))
    return {"message": "Elenco, cenário e áudio disponíveis para os próximos criativos deste projeto."}


@router.get("/{project}/creatives/{creative}/exports")
def list_exports(project: str, creative: str):
    with database() as db:
        require_creative(db, project, creative)
        return [dict(row) for row in db.execute("SELECT id,format,created_at FROM exports WHERE creative_id=? ORDER BY rowid DESC", (creative,))]


@router.post("/{project}/creatives/{creative}/exports/{format}", status_code=201)
async def store_export(project: str, creative: str, format: str, request: Request):
    if format not in ("gif", "webm"):
        raise HTTPException(422, "Formato não suportado.")
    with database() as db:
        require_creative(db, project, creative)
    identifier = str(uuid4())
    path = directory() / f"{identifier}.{format}"
    size = 0
    try:
        with path.open("xb") as file:
            async for chunk in request.stream():
                size += len(chunk)
                if size > 100 * 1024 * 1024:
                    raise HTTPException(413, "Exportação acima de 100 MB. A cópia baixada continua disponível.")
                file.write(chunk)
        if not size:
            raise HTTPException(422, "Arquivo vazio.")
        with database() as db:
            db.execute("INSERT INTO exports(id,creative_id,format) VALUES(?,?,?)", (identifier, creative, format))
    except BaseException:
        path.unlink(missing_ok=True)
        raise
    return {"id": identifier}


@router.get("/{project}/creatives/{creative}/exports/{export_id}")
def download_export(project: str, creative: str, export_id: str):
    with database() as db:
        require_creative(db, project, creative)
        row = db.execute("SELECT id,format FROM exports WHERE id=? AND creative_id=?", (export_id, creative)).fetchone()
        if not row:
            raise HTTPException(404, "Exportação não encontrada.")
    path = directory() / f"{row['id']}.{row['format']}"
    if not path.is_file():
        raise HTTPException(404, "Arquivo da exportação indisponível.")
    return FileResponse(path, filename=path.name, media_type="image/gif" if row["format"] == "gif" else "video/webm")
