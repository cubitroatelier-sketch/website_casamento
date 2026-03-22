import base64
import datetime
import hashlib
import hmac
import json
import os
import secrets
import sqlite3 as sqlite
import time
from typing import List, Optional, Union

from fastapi import Body, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


class Submissao(BaseModel):
    str_Nome: str
    str_Contacto: str
    str_Email: str
    str_Alergias: str
    str_Nomes: str
    str_Mensagem: str
    bool_Confirmacao: bool
    int_Adultos: int
    int_Criancas: int
    int_Bebes: int
    str_Website: str = ""


class DietaryRestrictions(BaseModel):
    glutenFree: bool
    vegetarian: bool
    vegan: bool
    nuts: bool
    seafood: bool
    lactose: bool
    other: bool
    otherText: str


class RSVP(BaseModel):
    adultNames: Optional[List[str]] = None
    childrenNames: Optional[List[str]] = None
    babyNames: Optional[List[str]] = None
    names: Optional[List[str]] = None
    email: str
    phone: str
    attendance: str
    absentNames: Optional[str] = None
    adults: str
    children: str
    babies: str
    dietaryRestrictions: Optional[Union[DietaryRestrictions, str]] = None
    message: Optional[str] = None
    timestamp: str
    id: int


class DeleteBody(BaseModel):
    id: int


class AdminLoginRequest(BaseModel):
    password: str


class AdminLoginResponse(BaseModel):
    token: str


api = FastAPI(title="API RSVP Casamento")

origins = [
    "http://catarinaediogo26.pt",
    "https://catarinaediogo26.pt",
    "http://www.catarinaediogo26.pt",
    "https://www.catarinaediogo26.pt",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

api.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key", "x-api-key"],
    max_age=86400,
)


def get_db():
    return sqlite.connect("./data/wedding.db", check_same_thread=False)


def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if value:
        return value
    raise HTTPException(status_code=500, detail=f"Configuração em falta: {name}")


def get_admin_password() -> str:
    return get_required_env("ADMIN_PASSWORD")


def get_admin_token_secret() -> str:
    return get_required_env("ADMIN_TOKEN_SECRET")


def get_admin_token_ttl() -> int:
    raw_value = os.getenv("ADMIN_TOKEN_TTL_SECONDS", "28800")
    try:
        ttl = int(raw_value)
    except ValueError:
        ttl = 28800
    return max(300, ttl)


def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_admin_token() -> str:
    payload = {
        "sub": "admin",
        "exp": int(time.time()) + get_admin_token_ttl(),
    }
    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    payload_part = b64url_encode(payload_json)
    signature = hmac.new(
        get_admin_token_secret().encode(),
        payload_part.encode(),
        hashlib.sha256,
    ).digest()
    return f"{payload_part}.{b64url_encode(signature)}"


def require_admin(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Não autenticado")

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload_part, signature_part = token.split(".", 1)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Token inválido") from exc

    expected_signature = b64url_encode(
        hmac.new(
            get_admin_token_secret().encode(),
            payload_part.encode(),
            hashlib.sha256,
        ).digest()
    )
    if not hmac.compare_digest(signature_part, expected_signature):
        raise HTTPException(status_code=401, detail="Token inválido")

    try:
        payload = json.loads(b64url_decode(payload_part))
    except (ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=401, detail="Token inválido") from exc

    if payload.get("sub") != "admin":
        raise HTTPException(status_code=401, detail="Token inválido")

    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(status_code=401, detail="Sessão expirada")


@api.post("/auth/login", response_model=AdminLoginResponse)
async def admin_login(credentials: AdminLoginRequest):
    if not secrets.compare_digest(credentials.password, get_admin_password()):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    return {"token": create_admin_token()}


@api.post("/submissoes")
async def post_submissao(submissao: Submissao):
    if submissao.str_Website.strip():
        raise HTTPException(status_code=400, detail="Submissão inválida")

    with get_db() as con:
        cur = con.cursor()
        cur.execute(
            """
            INSERT INTO sys_Submissoes
            (
                str_Nome,
                str_Contacto,
                str_Email,
                bool_Confirmacao,
                int_Adultos,
                int_Criancas,
                int_Bebes,
                str_Alergias,
                str_Nomes,
                str_Mensagem,
                dt_Create
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                submissao.str_Nome,
                submissao.str_Contacto,
                submissao.str_Email,
                int(submissao.bool_Confirmacao),
                submissao.int_Adultos,
                submissao.int_Criancas,
                submissao.int_Bebes,
                submissao.str_Alergias,
                submissao.str_Nomes,
                submissao.str_Mensagem,
                datetime.datetime.utcnow().isoformat(),
            ),
        )
    return {"message": "Submissão guardada com sucesso"}


@api.get("/estatisticas")
async def get_estatisticas(authorization: Optional[str] = Header(None)):
    require_admin(authorization)

    estatisticas = {}
    with get_db() as con:
        cur = con.cursor()

        cur.execute(
            """
            SELECT
                COUNT(int_SubmissaoID),
                COALESCE(SUM(CASE WHEN bool_Confirmacao = 1 THEN 1 ELSE 0 END),0),
                COALESCE(SUM(CASE WHEN bool_Confirmacao = 0 THEN 1 ELSE 0 END),0)
            FROM sys_Submissoes
            """
        )
        total, confirmados, nao_confirmados = cur.fetchone()

        estatisticas["total_submissoes"] = total
        estatisticas["confirmados"] = confirmados
        estatisticas["nao_confirmados_linhas"] = nao_confirmados

        cur.execute(
            """
            SELECT str_Nomes FROM sys_Submissoes WHERE bool_Confirmacao = 0
            """
        )
        rows = cur.fetchall()
        pessoas_nv = 0
        for row in rows:
            nomes = row[0] or ""
            pessoas_nv += len([n.strip() for n in nomes.split(",") if n.strip()])
        estatisticas["pessoas_nao_vao"] = pessoas_nv

    return estatisticas


@api.get("/submissoes", response_model=List[RSVP])
async def get_submissoes(authorization: Optional[str] = Header(None)):
    require_admin(authorization)

    rsvps = []
    with get_db() as con:
        cur = con.cursor()
        cur.execute(
            """
            SELECT
                str_Nomes,
                str_Email,
                str_Contacto,
                bool_Confirmacao,
                int_Adultos,
                int_Criancas,
                int_Bebes,
                str_Alergias,
                str_Mensagem,
                dt_Create,
                int_SubmissaoID
            FROM sys_Submissoes
            ORDER BY dt_Create DESC
            """
        )
        rows = cur.fetchall()

        for row in rows:
            nomes = row[0] or ""
            attendance = "sim" if row[3] else "nao"

            all_names = [n.strip() for n in nomes.split(",") if n.strip()]
            adults = min(row[4], len(all_names)) if row[4] else 0
            children = min(row[5], len(all_names) - adults) if row[5] else 0
            babies = min(row[6], len(all_names) - adults - children) if row[6] else 0

            adultNames = all_names[:adults]
            childrenNames = all_names[adults:adults + children]
            babyNames = all_names[adults + children:adults + children + babies]

            try:
                dietary = json.loads(row[7]) if row[7] else ""
            except (ValueError, TypeError):
                dietary = row[7]

            try:
                timestamp = datetime.datetime.fromisoformat(row[9]).isoformat()
            except ValueError:
                timestamp = str(row[9])

            rsvps.append(
                {
                    "adultNames": adultNames,
                    "childrenNames": childrenNames,
                    "babyNames": babyNames,
                    "names": all_names,
                    "email": row[1],
                    "phone": row[2],
                    "attendance": attendance,
                    "absentNames": ",".join(all_names) if attendance == "nao" else None,
                    "adults": str(row[4]),
                    "children": str(row[5]),
                    "babies": str(row[6]),
                    "dietaryRestrictions": dietary,
                    "message": row[8] or "",
                    "timestamp": timestamp,
                    "id": row[10],
                }
            )
    return rsvps


@api.delete("/submissoes")
async def delete_submissoes(
    id: int = Query(None),
    delete_body: Optional[DeleteBody] = Body(None),
    authorization: Optional[str] = Header(None),
):
    require_admin(authorization)

    if delete_body:
        id = delete_body.id
    elif id is None:
        raise HTTPException(status_code=400, detail="É necessário fornecer 'id'")

    with get_db() as con:
        cur = con.cursor()
        if id == 0:
            cur.execute("DELETE FROM sys_Submissoes")
        else:
            cur.execute("DELETE FROM sys_Submissoes WHERE int_SubmissaoID = ?", (id,))
        con.commit()
    return {"message": "Submissão(s) apagada(s) com sucesso"}
