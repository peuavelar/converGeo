"""OSM Overpass — Salvador e Lauro; nodes + centróide de way/relation."""

from __future__ import annotations

from typing import Any

import httpx

from convergeo_engine.config import Settings, get_settings
from convergeo_engine.geo import latlng_to_cell
from convergeo_engine.store import get_repository

QUERY = """
[out:json][timeout:90];
(
  node["highway"="bus_stop"]({bbox});
  node["public_transport"="station"]({bbox});
  node["natural"="beach"]({bbox});
  way["natural"="beach"]({bbox});
  node["leisure"="park"]({bbox});
  way["leisure"="park"]({bbox});
  node["amenity"="school"]({bbox});
  way["amenity"="school"]({bbox});
  node["amenity"~"hospital|clinic|doctors"]({bbox});
  node["shop"="supermarket"]({bbox});
  node["amenity"="bank"]({bbox});
);
out center;
"""

# Bbox RMS aproximada (Salvador + Lauro). A VERIFICAR vs malha oficial no ETL real.
BBOX = "-13.08,-38.65,-12.80,-38.25"


def _category(tags: dict[str, str]) -> str:
    if tags.get("highway") == "bus_stop":
        return "bus_stop"
    if tags.get("public_transport") == "station":
        return "station"
    if tags.get("natural") == "beach":
        return "beach"
    if tags.get("leisure") == "park":
        return "park"
    if tags.get("amenity") == "school":
        return "school"
    if tags.get("amenity") in {"hospital", "clinic", "doctors"}:
        return "saude"
    if tags.get("shop") == "supermarket":
        return "supermercado"
    if tags.get("amenity") == "bank":
        return "banco"
    return "outro"


def parse_overpass(payload: dict[str, Any]) -> list[dict]:
    rows: list[dict] = []
    for el in payload.get("elements") or []:
        tags = el.get("tags") or {}
        if "lat" in el and "lon" in el:
            lat, lng = float(el["lat"]), float(el["lon"])
        elif "center" in el:
            lat, lng = float(el["center"]["lat"]), float(el["center"]["lon"])
        else:
            continue
        rows.append(
            {
                "osm_id": f"{el.get('type')}/{el.get('id')}",
                "categoria": _category(tags),
                "nome": tags.get("name"),
                "lat": lat,
                "lng": lng,
                "h3_index": latlng_to_cell(lat, lng),
            }
        )
    return rows


def run_osm(
    store=None,
    settings: Settings | None = None,
    payload: dict[str, Any] | None = None,
) -> dict:
    settings = settings or get_settings()
    store = store or get_repository()
    if payload is None:
        q = QUERY.replace("{bbox}", BBOX)
        with httpx.Client(timeout=120.0) as client:
            res = client.post(
                settings.osm_overpass_url,
                data={"data": q},
                headers={"User-Agent": settings.nominatim_user_agent},
            )
            res.raise_for_status()
            payload = res.json()
    rows = parse_overpass(payload)
    store.replace_osm(rows)
    cats: dict[str, int] = {}
    for r in rows:
        cats[r["categoria"]] = cats.get(r["categoria"], 0) + 1
    return {"pois": len(rows), "por_categoria": cats}
