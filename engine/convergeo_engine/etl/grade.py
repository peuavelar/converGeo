"""Grade H3 mascarada pelos polígonos municipais (D5)."""

from __future__ import annotations

import json
from pathlib import Path

from shapely.geometry import shape

from convergeo_engine.config import Settings, get_settings
from convergeo_engine.geo import mask_hexes
from convergeo_engine.store import MemoryStore, get_store


def load_malha_geojson(path: str | Path) -> list[tuple[str, object]]:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    out: list[tuple[str, object]] = []
    for feat in data["features"]:
        props = feat.get("properties") or {}
        ibge = str(props.get("CD_MUN") or props.get("ibge") or "")
        geom = shape(feat["geometry"])
        out.append((ibge, geom))
    return out


def run_grade(store: MemoryStore | None = None, settings: Settings | None = None) -> dict:
    settings = settings or get_settings()
    store = store or get_store()
    path = settings.ibge_malha_path
    if not path:
        raise ValueError("IBGE_MALHA_PATH não definido (malha municipal IBGE).")
    municipios = [
        (ibge, geom)
        for ibge, geom in load_malha_geojson(path)
        if ibge in settings.ibge_municipios
    ]
    hexes = mask_hexes(
        municipios,
        resolution=settings.h3_resolution,
        min_land_frac=settings.min_land_area_frac,
    )
    store.replace_hexagonos(hexes)
    return {
        "hexagonos": len(hexes),
        "municipios": sorted({h["municipio_ibge"] for h in hexes}),
        "resolucao": settings.h3_resolution,
        "fonte_malha": "IBGE Malha Municipal (CD_MUN) — https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html",
    }
