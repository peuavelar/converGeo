"""H3, máscara municipal e geocodificação com cache e fallback."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable, Literal, Protocol

import h3
from pyproj import Geod
from shapely.geometry import Polygon, mapping, shape
from shapely.geometry.base import BaseGeometry
from shapely.strtree import STRtree

from convergeo_engine.config import Settings, get_settings

GeoPrecisao = Literal["cep", "endereco", "bairro", "sem"]
GEOD = Geod(ellps="WGS84")


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
    ring = [(lng, lat) for lat, lng in boundary]
    if ring[0] != ring[-1]:
        ring.append(ring[0])
    return Polygon(ring)


def geodesic_area_m2(geom: BaseGeometry) -> float:
    """Área elipsoidal (WGS84). Substitui a conversão fixa graus² × 111,32²."""
    if geom.is_empty:
        return 0.0
    area, _perim = GEOD.geometry_area_perimeter(geom)
    return abs(area)


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
    seen: dict[str, dict] = {}
    for ibge, geom in municipios:
        if geom.is_empty:
            continue
        for cell in cells_covering_polygon(geom, resolution):
            hex_g = hex_polygon(cell)
            inter = hex_g.intersection(geom)
            if inter.is_empty:
                continue
            hex_a = geodesic_area_m2(hex_g)
            frac = geodesic_area_m2(inter) / hex_a if hex_a else 0.0
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
    """Rateia população e domicílios pela fração de área (STRtree, área geodésica)."""
    hex_list = list(hexes)
    hex_geoms = [g for _h, g in hex_list]
    tree = STRtree(hex_geoms) if hex_geoms else None
    out: dict[str, dict] = {}
    for _setor_id, setor_g, pop, dom in setores:
        if setor_g.is_empty:
            continue
        setor_a = geodesic_area_m2(setor_g)
        if setor_a == 0:
            continue
        candidates = tree.query(setor_g) if tree is not None else []
        for idx in candidates:
            h3_index, hex_g = hex_list[int(idx)]
            inter = setor_g.intersection(hex_g)
            if inter.is_empty:
                continue
            frac = geodesic_area_m2(inter) / setor_a
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
        self.cep: dict[str, dict] = {}
        self.endereco: dict[str, dict] = {}

    def get_cep(self, cep: str) -> dict | None:
        return self.cep.get(cep)

    def set_cep(self, cep: str, lat: float | None, lng: float | None, status: str) -> None:
        self.cep[cep] = {"lat": lat, "lng": lng, "status": status}

    def get_endereco(self, query: str) -> dict | None:
        return self.endereco.get(query)

    def set_endereco(self, query: str, lat: float | None, lng: float | None, status: str) -> None:
        self.endereco[query] = {"lat": lat, "lng": lng, "status": status}


class RepoGeoCache:
    def __init__(self, repo: Any) -> None:
        self.repo = repo

    def get_cep(self, cep: str) -> dict | None:
        return self.repo.get_geo_cep(cep)

    def set_cep(self, cep: str, lat: float | None, lng: float | None, status: str) -> None:
        self.repo.set_geo_cep(cep, lat, lng, status)

    def get_endereco(self, query: str) -> dict | None:
        return self.repo.get_geo_endereco(query)

    def set_endereco(self, query: str, lat: float | None, lng: float | None, status: str) -> None:
        self.repo.set_geo_endereco(query, lat, lng, status)


def _coord(entry: dict | tuple | None) -> tuple[float, float] | None:
    if not entry:
        return None
    if isinstance(entry, tuple):
        return entry
    if entry.get("status") == "nao_encontrado":
        return None
    lat, lng = entry.get("lat"), entry.get("lng")
    if lat is None or lng is None:
        return None
    return float(lat), float(lng)


def geocode_with_fallback(
    *,
    cep: str | None,
    endereco: str | None,
    bairro: str | None,
    municipio: str | None,
    provider: GeoProvider,
    cache: Any,
) -> GeoResult:
    """CEP → endereço → centróide de polígono de bairro. Persiste acerto e falha."""

    def _get_cep(key: str) -> dict | tuple | None:
        if hasattr(cache, "get_cep"):
            return cache.get_cep(key)
        rec = cache.cep.get(key)
        if isinstance(rec, tuple):
            return {"lat": rec[0], "lng": rec[1], "status": "ok"}
        return rec

    def _set_cep(key: str, lat: float | None, lng: float | None, status: str) -> None:
        if hasattr(cache, "set_cep"):
            cache.set_cep(key, lat, lng, status)
        else:
            cache.cep[key] = (lat, lng) if lat is not None else None

    def _get_end(q: str) -> dict | tuple | None:
        if hasattr(cache, "get_endereco"):
            return cache.get_endereco(q)
        rec = cache.endereco.get(q)
        if isinstance(rec, tuple):
            return {"lat": rec[0], "lng": rec[1], "status": "ok"}
        return rec

    def _set_end(q: str, lat: float | None, lng: float | None, status: str) -> None:
        if hasattr(cache, "set_endereco"):
            cache.set_endereco(q, lat, lng, status)
        else:
            cache.endereco[q] = (lat, lng) if lat is not None else None

    if cep:
        key = "".join(ch for ch in cep if ch.isdigit())
        cached = _get_cep(key)
        if cached is not None:
            if isinstance(cached, dict) and cached.get("status") == "nao_encontrado":
                pass
            else:
                pair = _coord(cached)
                if pair:
                    return GeoResult(pair[0], pair[1], "cep")
        else:
            hit = provider.geocode_cep(key)
            if hit:
                _set_cep(key, hit[0], hit[1], "ok")
                return GeoResult(hit[0], hit[1], "cep")
            _set_cep(key, None, None, "nao_encontrado")

    if endereco:
        q = endereco.strip().lower()
        cached = _get_end(q)
        if cached is not None:
            if isinstance(cached, dict) and cached.get("status") == "nao_encontrado":
                pass
            else:
                pair = _coord(cached)
                if pair:
                    return GeoResult(pair[0], pair[1], "endereco")
        else:
            hit = provider.geocode_endereco(endereco)
            if hit:
                _set_end(q, hit[0], hit[1], "ok")
                return GeoResult(hit[0], hit[1], "endereco")
            _set_end(q, None, None, "nao_encontrado")

    if bairro and municipio:
        hit = provider.geocode_bairro(bairro, municipio)
        if hit:
            return GeoResult(hit[0], hit[1], "bairro")

    return GeoResult(None, None, "sem")
