from __future__ import annotations

from convergeo_engine.config import Settings, get_settings
from convergeo_engine.etl.cnpj import run_cnpj
from convergeo_engine.etl.grade import run_grade
from convergeo_engine.etl.ibge import run_ibge
from convergeo_engine.etl.osm import run_osm
from convergeo_engine.store import get_repository


def run_all(store=None, settings: Settings | None = None) -> dict:
    settings = settings or get_settings()
    store = store or get_repository()
    out = {
        "grade": run_grade(store, settings),
        "ibge": run_ibge(store, settings),
        "cnpj": run_cnpj(store, settings),
        "osm": run_osm(store, settings),
    }
    return out
