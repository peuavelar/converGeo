"""OSM Overpass — Salvador e Lauro; nodes + centróide de way/relation."""

from __future__ import annotations

from typing import Any

import httpx

from convergeo_engine.config import Settings, get_settings
from convergeo_engine.geo import latlng_to_cell
from convergeo_engine.store import MemoryStore, get_store

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
  node["amenity"="university"]({bbox});
  node["amenity"="college"]({bbox});
  node["amenity"~"hospital|clinic|doctors|pharmacy|restaurant|cafe|fast_food|bar|fuel|bank"]({bbox});
  node["amenity"="fuel"]({bbox});
  node["shop"~"supermarket|convenience|bakery|clothes|hairdresser|beauty|optician|doityourself|hardware|stationery|books|pet"]({bbox});
  node["shop"="chemist"]({bbox});
  node["leisure"~"fitness_centre|sports_centre"]({bbox});
  node["tourism"~"hotel|guest_house"]({bbox});
  node["office"="estate_agent"]({bbox});
);
out center;
"""

# Bbox RMS aproximada (Salvador + Lauro). A VERIFICAR vs malha oficial no ETL real.
BBOX = "-13.08,-38.65,-12.80,-38.25"
# Recorte do bootstrap (mesmo bbox do Thiago). south,west,north,east
BBOX_SALVADOR = "-13.0108,-38.5762,-12.7442,-38.2891"


def _category(tags: dict[str, str]) -> str:
    amenity = tags.get("amenity") or ""
    shop = tags.get("shop") or ""
    leisure = tags.get("leisure") or ""
    tourism = tags.get("tourism") or ""
    office = tags.get("office") or ""
    if tags.get("highway") == "bus_stop":
        return "bus_stop"
    if tags.get("public_transport") == "station":
        return "station"
    if tags.get("natural") == "beach":
        return "beach"
    if leisure == "park":
        return "park"
    if amenity in {"school", "university", "college"}:
        return amenity if amenity != "school" else "school"
    if amenity in {"hospital", "clinic", "doctors"}:
        return "saude"
    if amenity == "pharmacy" or shop == "chemist":
        return "pharmacy"
    if amenity in {"restaurant", "cafe", "fast_food", "bar"}:
        return amenity
    if amenity == "fuel":
        return "fuel"
    if amenity == "bank":
        return "banco"
    if shop in {"supermarket", "convenience"}:
        return "supermercado" if shop == "supermarket" else "convenience"
    if shop:
        return shop
    if leisure in {"fitness_centre", "sports_centre"}:
        return "fitness"
    if tourism in {"hotel", "guest_house"}:
        return tourism
    if office == "estate_agent":
        return "estate_agent"
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
    store: MemoryStore | None = None,
    settings: Settings | None = None,
    payload: dict[str, Any] | None = None,
    bbox: str | None = None,
) -> dict:
    settings = settings or get_settings()
    store = store or get_store()
    if payload is None:
        q = QUERY.replace("{bbox}", bbox or BBOX)
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
