"""CNPJs: todos os Estabelecimentos*.zip/csv, geocodificação em camadas (D1, D6)."""

from __future__ import annotations

import csv
from pathlib import Path

from convergeo_engine.config import Settings, get_settings
from convergeo_engine.etl.rf_municipios import filter_active_target, load_rf_municipio_map
from convergeo_engine.geo import GeoProvider, MemoryGeoCache, geocode_with_fallback, latlng_to_cell
from convergeo_engine.geo.nominatim import NominatimProvider
from convergeo_engine.store import MemoryStore, get_store

# Layout aberto da Receita (campos usados). Ver dados.gov.br CNPJ.
# situacao cadastral 02 = ativa.


class NullGeoProvider:
    def geocode_cep(self, cep: str) -> tuple[float, float] | None:
        return None

    def geocode_endereco(self, query: str) -> tuple[float, float] | None:
        return None

    def geocode_bairro(self, bairro: str, municipio: str) -> tuple[float, float] | None:
        return None


def _iter_estabelecimento_files(directory: Path) -> list[Path]:
    files = sorted(directory.glob("Estabelecimentos*")) + sorted(directory.glob("*.csv"))
    return [p for p in files if p.is_file()]


def run_cnpj(
    store: MemoryStore | None = None,
    settings: Settings | None = None,
    provider: GeoProvider | None = None,
) -> dict:
    settings = settings or get_settings()
    store = store or get_store()
    if not settings.rf_cnpj_dir or not settings.rf_municipios_csv:
        raise ValueError("RF_CNPJ_DIR e RF_MUNICIPIOS_CSV são obrigatórios.")
    rf_map = load_rf_municipio_map(settings.rf_municipios_csv)
    alvos = set(settings.ibge_municipios)
    cache = MemoryGeoCache()
    provider = provider or NominatimProvider(settings)
    rows: list[dict] = []
    files = _iter_estabelecimento_files(Path(settings.rf_cnpj_dir))
    for path in files:
        with path.open(encoding="utf-8", newline="") as fh:
            reader = csv.DictReader(fh)
            for rec in reader:
                ibge = filter_active_target(
                    rec.get("municipio") or rec.get("municipio_rf") or "",
                    rec.get("situacao") or rec.get("situacao_cadastral") or "",
                    alvos,
                    rf_map,
                )
                if not ibge:
                    continue
                cep = rec.get("cep") or ""
                log = " ".join(
                    p
                    for p in [
                        rec.get("tipo_logradouro"),
                        rec.get("logradouro"),
                        rec.get("numero"),
                        rec.get("bairro"),
                    ]
                    if p
                )
                geo = geocode_with_fallback(
                    cep=cep,
                    endereco=f"{log}, {rec.get('uf', '')}" if log else None,
                    bairro=rec.get("bairro"),
                    municipio=ibge,
                    provider=provider,
                    cache=cache,
                )
                if geo.precisao == "sem" or geo.lat is None:
                    continue
                h3_index = latlng_to_cell(geo.lat, geo.lng)
                rows.append(
                    {
                        "cnpj": rec.get("cnpj") or rec.get("cnpj_completo"),
                        "cnae_principal": rec.get("cnae_principal") or rec.get("cnae"),
                        "cnae_secundarias": rec.get("cnae_secundarias") or "",
                        "data_inicio": rec.get("data_inicio"),
                        "cep": cep,
                        "h3_index": h3_index,
                        "geo_precisao": geo.precisao,
                        "municipio_ibge": ibge,
                        "lat": geo.lat,
                        "lng": geo.lng,
                    }
                )
    store.replace_empresas(rows)
    precisao: dict[str, int] = {}
    hexes = set()
    for r in rows:
        precisao[r["geo_precisao"]] = precisao.get(r["geo_precisao"], 0) + 1
        hexes.add(r["h3_index"])
    mun_count: dict[str, int] = {}
    for r in rows:
        mun_count[r["municipio_ibge"]] = mun_count.get(r["municipio_ibge"], 0) + 1
    return {
        "arquivos": [p.name for p in files],
        "empresas_geocodificadas": len(rows),
        "por_municipio": mun_count,
        "geo_precisao": precisao,
        "hexagonos_com_empresas": len(hexes),
    }
