import datetime
from typing import List, Optional, Union
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body, FastAPI, HTTPException, Header, Query
from pydantic import BaseModel
import sqlite3 as sqlite
import json

# -----------------------------
# 1️⃣ Modelos Pydantic
# -----------------------------
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

# -----------------------------
# 2️⃣ App FastAPI
# -----------------------------
api = FastAPI(title="API RSVP Casamento")

origins = [
    "http://catarinaediogo26.pt",

    
]

api.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# 3️⃣ DB helper
# -----------------------------
def get_db():
    return sqlite.connect("./data/wedding.db", check_same_thread=False)

# -----------------------------
# 4️⃣ API Key
# -----------------------------
API_KEY = "CHAVE_SECRETA"

def validar_api_key(x_api_key: str):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Acesso negado")

# -----------------------------
# 5️⃣ POST Submissão
# -----------------------------
@api.post("/submissoes")
async def post_submissao(submissao: Submissao, x_api_key: str = Header(...)):
    validar_api_key(x_api_key)
    with get_db() as con:
        cur = con.cursor()
        cur.execute("""
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
        """, (
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
            datetime.datetime.utcnow().isoformat()
        ))
    return {"message": "Submissão guardada com sucesso"}

# -----------------------------
# 6️⃣ GET Estatísticas
# -----------------------------
@api.get("/estatisticas")
async def get_estatisticas():
    estatisticas = {}
    with get_db() as con:
        cur = con.cursor()
        
        cur.execute("""
            SELECT 
                COUNT(int_SubmissaoID),
                COALESCE(SUM(CASE WHEN bool_Confirmacao = 1 THEN 1 ELSE 0 END),0),
                COALESCE(SUM(CASE WHEN bool_Confirmacao = 0 THEN 1 ELSE 0 END),0)
            FROM sys_Submissoes
        """)
        total, confirmados, nao_confirmados = cur.fetchone()
        
        estatisticas["total_submissoes"] = total
        estatisticas["confirmados"] = confirmados
        estatisticas["nao_confirmados_linhas"] = nao_confirmados

        cur.execute("""
            SELECT str_Nomes FROM sys_Submissoes WHERE bool_Confirmacao = 0
        """)
        rows = cur.fetchall()
        pessoas_nv = 0
        for row in rows:
            nomes = row[0] or ""
            pessoas_nv += len([n.strip() for n in nomes.split(",") if n.strip()])
        estatisticas["pessoas_nao_vao"] = pessoas_nv

    return estatisticas

# -----------------------------
# 7️⃣ GET Submissões
# -----------------------------
@api.get("/submissoes", response_model=List[RSVP])
async def get_submissoes():
    rsvps = []
    with get_db() as con:
        cur = con.cursor()
        cur.execute("""
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
        """)
        rows = cur.fetchall()
        
        for row in rows:
            nomes = row[0] or ""
            attendance = "sim" if row[3] else "nao"
            
            all_names = [n.strip() for n in nomes.split(",") if n.strip()]
            adults = min(row[4], len(all_names)) if row[4] else 0
            children = min(row[5], len(all_names) - adults) if row[5] else 0
            babies = min(row[6], len(all_names) - adults - children) if row[6] else 0
            
            adultNames = all_names[:adults]
            childrenNames = all_names[adults:adults+children]
            babyNames = all_names[adults+children:adults+children+babies]

            try:
                dietary = json.loads(row[7]) if row[7] else ""
            except:
                dietary = row[7]

            try:
                timestamp = datetime.datetime.fromisoformat(row[9]).isoformat()
            except:
                timestamp = str(row[9])

            rsvps.append({
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
                "id": row[10]
            })
    return rsvps

# -----------------------------
# 8️⃣ DELETE Submissões (flexível)
# -----------------------------
class DeleteBody(BaseModel):
    id: int

@api.delete("/submissoes")
async def delete_submissoes(
    id: int = Query(None),
    delete_body: Optional[DeleteBody] = Body(None),
    x_api_key: str = Header(...)
):
    validar_api_key(x_api_key)

    # Prioridade para body, depois query
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