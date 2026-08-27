from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import bcrypt
import jwt
import psycopg
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel


DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://gestao:gestao@db:5432/gestao")
JWT_SECRET = os.getenv("JWT_SECRET", "troque-esta-chave-em-producao")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@gestao.local").lower()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@123")
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/data/uploads"))
MAX_UPLOAD = 5 * 1024 * 1024

app = FastAPI(title="Gestão Operacional API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost").split(",")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


class LoginBody(BaseModel):
    email: str
    password: str


class PasswordBody(BaseModel):
    current_password: str
    new_password: str


def connection():
    return psycopg.connect(DATABASE_URL, autocommit=True)


def initialize_database() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id BIGSERIAL PRIMARY KEY,
                name VARCHAR(160) NOT NULL,
                email VARCHAR(190) UNIQUE NOT NULL,
                password_hash VARCHAR(100) NOT NULL,
                role VARCHAR(100) NOT NULL DEFAULT 'Administrador',
                active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS app_state (
                id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
                payload JSONB NOT NULL DEFAULT '{}'::jsonb,
                version BIGINT NOT NULL DEFAULT 1,
                updated_by BIGINT REFERENCES users(id),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS audit_log (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id),
                action VARCHAR(180) NOT NULL,
                details JSONB NOT NULL DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS stored_files (
                id UUID PRIMARY KEY,
                original_name VARCHAR(255) NOT NULL,
                content_type VARCHAR(120),
                size_bytes BIGINT NOT NULL,
                storage_path VARCHAR(500) NOT NULL,
                uploaded_by BIGINT REFERENCES users(id),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        cursor.execute("SELECT id FROM users WHERE email = %s", (ADMIN_EMAIL,))
        if cursor.fetchone() is None:
            password_hash = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode()
            cursor.execute(
                "INSERT INTO users (name, email, password_hash, role) VALUES (%s, %s, %s, 'Administrador')",
                ("Administrador", ADMIN_EMAIL, password_hash),
            )
        cursor.execute("INSERT INTO app_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING")


@app.on_event("startup")
def startup() -> None:
    initialize_database()


def make_token(user_id: int, email: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": str(user_id), "email": email, "role": role, "iat": now, "exp": now + timedelta(hours=12)}, JWT_SECRET, algorithm="HS256")


def current_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Autenticação necessária")
    try:
        claims = jwt.decode(authorization.removeprefix("Bearer "), JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(401, "Sessão inválida ou expirada") from exc
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("SELECT id, name, email, role, active FROM users WHERE id = %s", (int(claims["sub"]),))
        row = cursor.fetchone()
    if not row or not row[4]:
        raise HTTPException(401, "Usuário inativo")
    return {"id": row[0], "name": row[1], "email": row[2], "role": row[3]}


def require_admin(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    if user["role"] != "Administrador":
        raise HTTPException(403, "Ação exclusiva de administrador")
    return user


def audit(user_id: int, action: str, details: dict[str, Any] | None = None) -> None:
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("INSERT INTO audit_log (user_id, action, details) VALUES (%s, %s, %s::jsonb)", (user_id, action, json.dumps(details or {})))


@app.get("/api/health")
def health() -> dict[str, str]:
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("SELECT 1")
        cursor.fetchone()
    return {"status": "ok"}


@app.post("/api/auth/login")
def login(body: LoginBody):
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("SELECT id, name, email, password_hash, role, active FROM users WHERE email = %s", (body.email.lower(),))
        row = cursor.fetchone()
    if not row or not row[5] or not bcrypt.checkpw(body.password.encode(), row[3].encode()):
        raise HTTPException(401, "Credenciais inválidas")
    audit(row[0], "login")
    return {"token": make_token(row[0], row[2], row[4]), "user": {"id": row[0], "name": row[1], "email": row[2], "role": row[4]}}


@app.post("/api/auth/change-password")
def change_password(body: PasswordBody, user: dict[str, Any] = Depends(current_user)):
    if len(body.new_password) < 8:
        raise HTTPException(422, "A nova senha deve ter ao menos 8 caracteres")
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("SELECT password_hash FROM users WHERE id = %s", (user["id"],))
        current_hash = cursor.fetchone()[0]
        if not bcrypt.checkpw(body.current_password.encode(), current_hash.encode()):
            raise HTTPException(400, "Senha atual incorreta")
        new_hash = bcrypt.hashpw(body.new_password.encode(), bcrypt.gensalt()).decode()
        cursor.execute("UPDATE users SET password_hash = %s, updated_at = NOW() WHERE id = %s", (new_hash, user["id"]))
    audit(user["id"], "change_password")
    return {"ok": True}


@app.get("/api/state")
def get_state(user: dict[str, Any] = Depends(current_user)):
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("SELECT payload, version, updated_at FROM app_state WHERE id = 1")
        payload, version, updated_at = cursor.fetchone()
    return {"payload": payload, "version": version, "updated_at": updated_at, "user": user}


@app.put("/api/state")
def put_state(payload: dict[str, Any], user: dict[str, Any] = Depends(current_user)):
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("UPDATE app_state SET payload = %s::jsonb, version = version + 1, updated_by = %s, updated_at = NOW() WHERE id = 1 RETURNING version, updated_at", (json.dumps(payload), user["id"]))
        version, updated_at = cursor.fetchone()
    audit(user["id"], "state_update", {"version": version})
    return {"ok": True, "version": version, "updated_at": updated_at}


@app.get("/api/backup")
def download_backup(user: dict[str, Any] = Depends(require_admin)):
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("SELECT payload, version, updated_at FROM app_state WHERE id = 1")
        payload, version, updated_at = cursor.fetchone()
    audit(user["id"], "backup_download", {"version": version})
    return JSONResponse({"created_at": datetime.now(timezone.utc).isoformat(), "version": version, "updated_at": updated_at.isoformat(), "payload": payload}, headers={"Content-Disposition": f'attachment; filename="backup-gestao-{datetime.now():%Y%m%d-%H%M}.json"'})


@app.post("/api/backup/restore")
def restore_backup(payload: dict[str, Any], user: dict[str, Any] = Depends(require_admin)):
    restored = payload.get("payload", payload)
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("UPDATE app_state SET payload = %s::jsonb, version = version + 1, updated_by = %s, updated_at = NOW() WHERE id = 1 RETURNING version", (json.dumps(restored), user["id"]))
        version = cursor.fetchone()[0]
    audit(user["id"], "backup_restore", {"version": version})
    return {"ok": True, "version": version}


@app.get("/api/audit")
def list_audit(limit: int = 100, user: dict[str, Any] = Depends(require_admin)):
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("SELECT a.id, COALESCE(u.name, 'Sistema'), a.action, a.details, a.created_at FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT %s", (min(max(limit, 1), 500),))
        rows = cursor.fetchall()
    return [{"id": row[0], "user": row[1], "action": row[2], "details": row[3], "created_at": row[4]} for row in rows]


@app.post("/api/files")
async def upload_file(file: UploadFile = File(...), user: dict[str, Any] = Depends(current_user)):
    from uuid import uuid4
    content = await file.read(MAX_UPLOAD + 1)
    if len(content) > MAX_UPLOAD:
        raise HTTPException(413, "Arquivo maior que 5 MB")
    file_id = uuid4()
    extension = Path(file.filename or "arquivo").suffix.lower()[:10]
    destination = UPLOAD_DIR / f"{file_id}{extension}"
    destination.write_bytes(content)
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("INSERT INTO stored_files (id, original_name, content_type, size_bytes, storage_path, uploaded_by) VALUES (%s, %s, %s, %s, %s, %s)", (file_id, file.filename or "arquivo", file.content_type, len(content), str(destination), user["id"]))
    audit(user["id"], "file_upload", {"file_id": str(file_id), "name": file.filename})
    return {"id": str(file_id), "name": file.filename, "size": len(content)}


@app.get("/api/files/{file_id}")
def get_file(file_id: str, user: dict[str, Any] = Depends(current_user)):
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("SELECT original_name, content_type, storage_path FROM stored_files WHERE id = %s", (file_id,))
        row = cursor.fetchone()
    if not row or not Path(row[2]).is_file():
        raise HTTPException(404, "Arquivo não encontrado")
    return FileResponse(row[2], media_type=row[1], filename=row[0])

