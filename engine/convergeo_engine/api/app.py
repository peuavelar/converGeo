from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from convergeo_engine.api.v1 import router as v1_router
from convergeo_engine.api.v2 import router as v2_router
from convergeo_engine.config import get_settings
from convergeo_engine.migrate import migrate
from convergeo_engine.security import assert_production_secrets
from convergeo_engine.seed_demo import seed_demo
from convergeo_engine.store import get_repository

settings = get_settings()
VERSION = "1.3.1"


def allow_demo_seed() -> bool:
    if settings.database_url:
        return False
    if os.environ.get("RENDER") or os.environ.get("K_SERVICE"):
        return False
    flag = os.environ.get("ENGINE_SEED_DEMO", "1").strip().lower()
    return flag not in {"0", "false", "no"}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    assert_production_secrets()
    if allow_demo_seed():
        seed_demo()
    yield


app = FastAPI(
    title="ConverGeo Engine",
    description="Motor preditivo e marketplace (v1 compat + v2 imobiliário)",
    version=VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(v1_router)
app.include_router(v2_router)


@app.get("/health")
def health():
    repo = get_repository()
    body: dict = {
        "status": "ok",
        "version": VERSION,
        "repositorio": "postgres" if settings.database_url else "memoria",
        "schema": settings.engine_schema,
        "v1_source": settings.v1_source if settings.database_url else "memoria",
    }
    if settings.database_url:
        from convergeo_engine.migrate import applied_versions

        body["migracoes"] = applied_versions()
        body["contagens"] = repo.table_counts()
    if allow_demo_seed() or getattr(repo, "demo", False):
        body["demo"] = True
        counts = repo.table_counts()
        body["hexagonos"] = counts.get("hexagonos")
        body["scores"] = counts.get("scores")
        body["imoveis"] = counts.get("imoveis")
    return body
