"""Aplica migrações uma vez, com checksum. Nunca toca o schema legado."""

from __future__ import annotations

import hashlib
from pathlib import Path

from convergeo_engine.config import ENGINE_ROOT, get_settings


def _checksum(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def migrate() -> list[str]:
    settings = get_settings()
    applied: list[str] = []
    if not settings.database_url:
        applied.append("skip: DATABASE_URL vazio (modo memória)")
        return applied

    from convergeo_engine.db import connection

    mig_dir = ENGINE_ROOT / "db" / "migrations"
    files = sorted(mig_dir.glob("*.sql"))
    with connection(settings) as conn:
        cur = conn.cursor()
        # bootstrap schema + migrations table from 000 without depending on it
        cur.execute("CREATE SCHEMA IF NOT EXISTS convergeo_engine")
        cur.execute(
            """CREATE TABLE IF NOT EXISTS convergeo_engine.schema_migrations (
                 versao text PRIMARY KEY,
                 aplicada_em timestamptz NOT NULL DEFAULT now(),
                 checksum text NOT NULL
               )"""
        )
        for path in files:
            sql = path.read_text(encoding="utf-8")
            chk = _checksum(sql)
            cur.execute(
                "SELECT checksum FROM convergeo_engine.schema_migrations WHERE versao = %s",
                (path.name,),
            )
            row = cur.fetchone()
            if row:
                if row[0] != chk:
                    raise RuntimeError(f"Checksum alterado da migração já aplicada: {path.name}")
                continue
            cur.execute(sql)
            cur.execute(
                "INSERT INTO convergeo_engine.schema_migrations (versao, checksum) VALUES (%s,%s)",
                (path.name, chk),
            )
            applied.append(path.name)
    return applied


def applied_versions() -> list[str]:
    settings = get_settings()
    if not settings.database_url:
        return []
    from convergeo_engine.db import connection

    with connection(settings) as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT versao FROM convergeo_engine.schema_migrations ORDER BY versao"
        )
        return [r[0] for r in cur.fetchall()]
