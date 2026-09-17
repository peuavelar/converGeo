"""Provedores de geocodificação plugáveis (CEP local + cadeia)."""

from __future__ import annotations

import csv
import json
from pathlib import Path

from shapely.geometry import shape

from convergeo_engine.config import Settings, get_settings
from convergeo_engine.geo.nominatim import NominatimProvider


class CepFileProvider:
    """Base local CEP → coordenada. Formato CSV: cep,lat,lng (sem fornecedor fixo)."""

    def __init__(self, path: str | Path) -> None:
        self.table: dict[str, tuple[float, float]] = {}
        p = Path(path)
        if not p.is_file():
            return
        with p.open(encoding="utf-8-sig", newline="") as fh:
            reader = csv.DictReader(fh)
            for row in reader:
                cep = "".join(ch for ch in (row.get("cep") or "") if ch.isdigit()).zfill(8)
                try:
                    self.table[cep] = (float(row["lat"]), float(row["lng"]))
                except (KeyError, TypeError, ValueError):
                    continue

    def geocode_cep(self, cep: str) -> tuple[float, float] | None:
        digits = "".join(ch for ch in cep if ch.isdigit()).zfill(8)
        return self.table.get(digits)

    def geocode_endereco(self, query: str) -> tuple[float, float] | None:
        return None

    def geocode_bairro(self, bairro: str, municipio: str) -> tuple[float, float] | None:
        return None


class BairroPolygonProvider:
    """Centróide do polígono do bairro (GeoJSON). Sem busca textual livre."""

    def __init__(self, path: str | Path) -> None:
        self.centroids: dict[tuple[str, str], tuple[float, float]] = {}
        p = Path(path)
        if not p.is_file():
            return
        data = json.loads(p.read_text(encoding="utf-8"))
        for feat in data.get("features") or []:
            props = feat.get("properties") or {}
            name = str(props.get("bairro") or props.get("NM_BAIRRO") or "").strip().lower()
            mun = str(props.get("municipio_ibge") or props.get("CD_MUN") or "").strip()
            geom = feat.get("geometry")
            if not name or not geom:
                continue
            c = shape(geom).centroid
            self.centroids[(name, mun)] = (c.y, c.x)

    def geocode_cep(self, cep: str) -> tuple[float, float] | None:
        return None

    def geocode_endereco(self, query: str) -> tuple[float, float] | None:
        return None

    def geocode_bairro(self, bairro: str, municipio: str) -> tuple[float, float] | None:
        key = (bairro.strip().lower(), municipio.strip())
        hit = self.centroids.get(key)
        if hit:
            return hit
        name = bairro.strip().lower()
        for (n, _m), coord in self.centroids.items():
            if n == name:
                return coord
        return None


class ChainProvider:
    def __init__(self, providers: list) -> None:
        self.providers = providers

    def geocode_cep(self, cep: str) -> tuple[float, float] | None:
        for p in self.providers:
            hit = p.geocode_cep(cep)
            if hit:
                return hit
        return None

    def geocode_endereco(self, query: str) -> tuple[float, float] | None:
        for p in self.providers:
            hit = p.geocode_endereco(query)
            if hit:
                return hit
        return None

    def geocode_bairro(self, bairro: str, municipio: str) -> tuple[float, float] | None:
        for p in self.providers:
            hit = p.geocode_bairro(bairro, municipio)
            if hit:
                return hit
        return None


def build_providers(settings: Settings | None = None):
    settings = settings or get_settings()
    names = [n.strip() for n in settings.geo_providers.split(",") if n.strip()]
    out = []
    for name in names:
        if name == "cep_file" and settings.geo_cep_file:
            out.append(CepFileProvider(settings.geo_cep_file))
        elif name == "nominatim":
            out.append(NominatimProvider(settings))
        elif name == "bairro_poly":
            path = getattr(settings, "geo_bairro_geojson", "") or ""
            if path:
                out.append(BairroPolygonProvider(path))
    if not out:
        out.append(NominatimProvider(settings))
    return ChainProvider(out)
