"""Converte mocks do front em CSV do template oficial."""

from __future__ import annotations

from pathlib import Path

from convergeo_engine.config import ENGINE_ROOT
from convergeo_engine.marketplace.ingest import TEMPLATE_FIELDS, ingest_csv
from convergeo_engine.store import get_repository

SEED_CSV = ENGINE_ROOT / "templates" / "imoveis_seed_from_mocks.csv"


def seed_from_csv(path: Path | None = None, store=None) -> dict:
    store = store or get_repository()
    if not any(a["id"] == "seed-proprietario" for a in store.list_anunciantes()):
        store.upsert_anunciante(
            {
                "id": "seed-proprietario",
                "tipo": "proprietario",
                "nome": "Seed ConverGeo",
                "is_seed": True,
                "ativo": True,
            }
        )
    content = (path or SEED_CSV).read_text(encoding="utf-8")
    return ingest_csv("seed-proprietario", content, store)
