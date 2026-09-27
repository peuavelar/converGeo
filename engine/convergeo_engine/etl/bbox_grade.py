"""Grade H3 de Salvador por bounding box — sem malha IBGE.

Mesmo recorte técnico do motor do Thiago. pct_area_terrestre é a
interseção com o retângulo, não com o litoral oficial (fonte=bbox_salvador).
"""

from __future__ import annotations

from shapely.geometry import box

from convergeo_engine.config import Settings, get_settings
from convergeo_engine.geo import mask_hexes
from convergeo_engine.store import MemoryStore, get_store

# Thiago: generate_hexagonos_01.py
SALVADOR_BBOX = {
    "lat_min": -13.0108,
    "lat_max": -12.7442,
    "lng_min": -38.5762,
    "lng_max": -38.2891,
}


def salvador_box():
    b = SALVADOR_BBOX
    return box(b["lng_min"], b["lat_min"], b["lng_max"], b["lat_max"])


def run_bbox_grade(
    store: MemoryStore | None = None,
    settings: Settings | None = None,
) -> dict:
    settings = settings or get_settings()
    store = store or get_store()
    hexes = mask_hexes(
        [(settings.ibge_salvador, salvador_box())],
        resolution=settings.h3_resolution,
        min_land_frac=settings.min_land_area_frac,
    )
    for row in hexes:
        row["fonte"] = "bbox_salvador"
        row["h3_resolucao"] = settings.h3_resolution
    store.replace_hexagonos(hexes)
    return {
        "hexagonos": len(hexes),
        "municipios": [settings.ibge_salvador],
        "resolucao": settings.h3_resolution,
        "fonte_malha": "bbox_salvador (modelo Thiago; sem máscara litoral IBGE)",
    }
