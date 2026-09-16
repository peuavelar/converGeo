from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from convergeo_engine.api.v1 import router as v1_router
from convergeo_engine.api.v2 import router as v2_router
from convergeo_engine.config import ENGINE_ROOT, get_settings

settings = get_settings()

app = FastAPI(
    title="ConverGeo Engine",
    description="Motor preditivo e marketplace (v1 compat + v2 imobiliário)",
    version="1.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(v1_router)
app.include_router(v2_router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "1.3.0",
        "database": bool(settings.database_url),
        "schema": settings.db_schema,
    }


def migrate() -> list[str]:
    applied = []
    if not settings.database_url:
        applied.append("skip: DATABASE_URL vazio (modo memória)")
        return applied
    from convergeo_engine.db import connection

    mig_dir = ENGINE_ROOT / "db" / "migrations"
    with connection() as conn:
        cur = conn.cursor()
        for path in sorted(mig_dir.glob("*.sql")):
            cur.execute(path.read_text(encoding="utf-8"))
            applied.append(path.name)
    return applied
