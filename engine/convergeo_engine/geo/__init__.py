"""H3, máscara municipal e geocodificação com cache e fallback."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Iterable, Literal, Protocol

import h3
from shapely.geometry import Polygon, mapping, shape
from shapely.geometry.base import BaseGeometry

from convergeo_engine.config import Settings, get_settings

GeoPrecisao = Literal["cep", "endereco", "bairro", "sem"]


class GeoProvider(Protocol):
    def geocode_cep(self, cep: str) -> tuple[float, float] | None: ...
    def geocode_endereco(self, query: str) -> tuple[float, float] | None: ...
    def geocode_bairro(self, bairro: str, municipio: str) -> tuple[float, float] | None: ...


@dataclass
class GeoResult:
    lat: float | None
    lng: float | None
    precisao: GeoPrecisao


def cell_center(h3_index: str) -> tuple[float, float]:
    return h3.cell_to_latlng(h3_index)


def latlng_to_cell(lat: float, lng: float, res: int | None = None) -> str:
    settings = get_settings()
    return h3.latlng_to_cell(lat, lng, res or settings.h3_resolution)


def hex_polygon(h3_index: str) -> Polygon:
    boundary = h3.cell_to_boundary(h3_index)
    # h3 v4 returns [(lat, lng), ...]; shapely wants (lng, lat)
    ring = [(lng, lat) for lat, lng in boundary]
    if ring[0] != ring[-1]:
        ring.append(ring[0])
    return Polygon(ring)


def cells_covering_polygon(geom: BaseGeometry, resolution: int) -> list[str]:
    try:
        return list(h3.geo_to_cells(geom, resolution))
    except Exception:
        geojson = mapping(geom)
        try:
            return list(h3.geo_to_cells(geojson, resolution))
        except TypeError:
            return list(h3.polyfill(geojson, resolution, geo_json_conformant=True))


def mask_hexes(
    municipios: Iterable[tuple[str, BaseGeometry]],
    *,
    resolution: int,
    min_land_frac: float,
) -> list[dict]:
    """Gera hexágonos H3 só sobre polígonos municipais (corrige D5)."""
    seen: dict[str, dict] = {}
    for ibge, geom in municipios:
        if geom.is_empty:
            continue
        for cell in cells_covering_polygon(geom, resolution):
            hex_g = hex_polygon(cell)
            inter = hex_g.intersection(geom)
            if inter.is_empty:
                continue
            frac = inter.area / hex_g.area if hex_g.area else 0.0
            if frac < min_land_frac:
                continue
            prev = seen.get(cell)
            if prev is None or frac > prev["pct_area_terrestre"]:
                lat, lng = cell_center(cell)
                seen[cell] = {
                    "h3_index": cell,
                    "municipio_ibge": ibge,
                    "pct_area_terrestre": round(frac, 4),
                    "lat": lat,
                    "lng": lng,
                }
    return list(seen.values())


def area_apportion(
    setores: Iterable[tuple[str, BaseGeometry, float, float]],
    hexes: Iterable[tuple[str, BaseGeometry]],
) -> list[dict]:
    """Rateia população e domicílios pela fração de área (setor ∩ hex)."""
    hex_list = list(hexes)
    out: dict[str, dict] = {}
    for setor_id, setor_g, pop, dom in setores:
        if setor_g.is_empty or setor_g.area == 0:
            continue
        for h3_index, hex_g in hex_list:
            inter = setor_g.intersection(hex_g)
            if inter.is_empty:
                continue
            frac = inter.area / setor_g.area
            rec = out.setdefault(
                h3_index,
                {"h3_index": h3_index, "populacao": 0.0, "domicilios": 0.0},
            )
            rec["populacao"] += pop * frac
            rec["domicilios"] += dom * frac
    for rec in out.values():
        rec["populacao"] = round(rec["populacao"], 4)
        rec["domicilios"] = round(rec["domicilios"], 4)
    return list(out.values())


class MemoryGeoCache:
    def __init__(self) -> None:
        self.cep: dict[str, tuple[float, float]] = {}
        self.endereco: dict[str, tuple[float, float]] = {}


def geocode_with_fallback(
    *,
    cep: str | None,
    endereco: str | None,
    bairro: str | None,
    municipio: str | None,
    provider: GeoProvider,
    cache: MemoryGeoCache,
) -> GeoResult:
    """CEP → endereço → centróide de bairro. Sem dicionário manual (D1)."""
    if cep:
        key = "".join(ch for ch in cep if ch.isdigit())
        if key in cache.cep:
            lat, lng = cache.cep[key]
            return GeoResult(lat, lng, "cep")
        hit = provider.geocode_cep(key)
        if hit:
            cache.cep[key] = hit
            return GeoResult(hit[0], hit[1], "cep")

    if endereco:
        q = endereco.strip().lower()
        if q in cache.endereco:
            lat, lng = cache.endereco[q]
            return GeoResult(lat, lng, "endereco")
        hit = provider.geocode_endereco(endereco)
        if hit:
            cache.endereco[q] = hit
            return GeoResult(hit[0], hit[1], "endereco")

    if bairro and municipio:
        hit = provider.geocode_bairro(bairro, municipio)
        if hit:
            return GeoResult(hit[0], hit[1], "bairro")

    return GeoResult(None, None, "sem")
