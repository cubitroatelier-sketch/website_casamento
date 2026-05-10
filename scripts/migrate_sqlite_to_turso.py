#!/usr/bin/env python3
import argparse
import getpass
import os
import sqlite3
from pathlib import Path
from typing import Any, Sequence


CREATE_SUBMISSOES_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS sys_Submissoes (
    int_SubmissaoID INTEGER PRIMARY KEY AUTOINCREMENT,
    str_Nome TEXT NOT NULL DEFAULT '',
    str_Contacto TEXT NOT NULL DEFAULT '',
    str_Email TEXT NOT NULL DEFAULT '',
    bool_Confirmacao INTEGER NOT NULL DEFAULT 0,
    int_Adultos INTEGER NOT NULL DEFAULT 0,
    int_Criancas INTEGER NOT NULL DEFAULT 0,
    int_Bebes INTEGER NOT NULL DEFAULT 0,
    str_Alergias TEXT NOT NULL DEFAULT '',
    str_Nomes TEXT NOT NULL DEFAULT '',
    str_Mensagem TEXT NOT NULL DEFAULT '',
    dt_Create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
"""


def get_required_env(name: str, *, secret: bool = False) -> str:
    value = os.getenv(name)
    if value:
        return value

    if secret:
        value = getpass.getpass(f"{name}: ").strip()
    else:
        value = input(f"{name}: ").strip()

    if value:
        return value

    raise SystemExit(f"Valor em falta: {name}")


def execute_write(conn: Any, sql: str, params: Sequence[Any] = ()) -> None:
    conn.execute(sql, params)
    conn.commit()


def connect_turso():
    try:
        import libsql
    except ImportError as exc:
        raise SystemExit("Dependencia em falta: instala com 'pip install libsql'") from exc

    return libsql.connect(
        database=get_required_env("TURSO_DATABASE_URL"),
        auth_token=get_required_env("TURSO_AUTH_TOKEN", secret=True),
    )


def init_turso_schema(conn: Any) -> None:
    execute_write(conn, CREATE_SUBMISSOES_TABLE_SQL)


def migrate_rows(sqlite_path: Path, turso_conn: Any) -> int:
    if not sqlite_path.exists():
        raise SystemExit(f"SQLite local nao encontrada: {sqlite_path}")

    with sqlite3.connect(sqlite_path) as sqlite_conn:
        rows = sqlite_conn.execute(
            """
            SELECT
                int_SubmissaoID,
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
            FROM sys_Submissoes
            ORDER BY int_SubmissaoID ASC
            """
        ).fetchall()

    for row in rows:
        execute_write(
            turso_conn,
            """
            INSERT OR IGNORE INTO sys_Submissoes
            (
                int_SubmissaoID,
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            row,
        )

    return len(rows)


def count_remote_rows(conn: Any) -> int:
    row = conn.execute("SELECT COUNT(*) FROM sys_Submissoes").fetchone()
    return int(row[0])


def main() -> None:
    parser = argparse.ArgumentParser(description="Inicializa Turso e migra dados SQLite locais.")
    parser.add_argument(
        "--sqlite-path",
        default="data/wedding.db",
        help="Caminho da SQLite local a migrar. Default: data/wedding.db",
    )
    parser.add_argument(
        "--init-only",
        action="store_true",
        help="Apenas cria a tabela no Turso; nao migra dados locais.",
    )
    args = parser.parse_args()

    turso_conn = connect_turso()
    try:
        init_turso_schema(turso_conn)

        migrated = 0
        if not args.init_only:
            migrated = migrate_rows(Path(args.sqlite_path), turso_conn)

        total = count_remote_rows(turso_conn)
    finally:
        close = getattr(turso_conn, "close", None)
        if callable(close):
            close()

    print(f"Turso pronto. Linhas locais processadas: {migrated}. Total remoto: {total}.")


if __name__ == "__main__":
    main()
