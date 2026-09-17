"""CNPJs: leitura oficial dos zips da Receita (latin1, ';', sem cabeçalho).

Dicionário / layout consultado em 2026-09-16:
- Dados abertos CNPJ (Receita Federal):
  https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos/receitafederal/cadastro-nacional-da-pessoa-juridica-cnpj
- Metadados da tabela de municípios (código TOM + nome, não IBGE):
  https://www.gov.br/receitafederal/dados/municipios-metadados.pdf
- Tabela TOM↔IBGE:
  https://www.gov.br/receitafederal/dados/municipios.csv/view

Arquivos Estabelecimentos*.zip: CSV sem cabeçalho, separador `;`, encoding latin1 (ISO-8859-1).
Situação cadastral ativa = `02` (mesmo dicionário).
"""

from __future__ import annotations

import csv
import io
import time
import zipfile
from pathlib import Path

from convergeo_engine.config import Settings, get_settings
from convergeo_engine.etl.rf_municipios import filter_active_target, load_rf_municipio_map
from convergeo_engine.geo import GeoProvider, RepoGeoCache, geocode_with_fallback, latlng_to_cell
from convergeo_engine.geo.providers import build_providers
from convergeo_engine.store import get_repository

# Ordem das colunas do arquivo de ESTABELECIMENTOS (0-based), layout RF dados abertos.
# Fonte: dicionário de dados CNPJ aberto (consulta 2026-09-16). Nomes internos nossos;
# o arquivo oficial NÃO traz cabeçalho.
ESTABELECIMENTO_COLS = [
    "cnpj_basico",  # 0  8 dígitos
    "cnpj_ordem",  # 1  4 dígitos
    "cnpj_dv",  # 2  2 dígitos
    "identificador_matriz_filial",  # 3
    "nome_fantasia",  # 4
    "situacao_cadastral",  # 5  02 = ativa
    "data_situacao_cadastral",  # 6
    "motivo_situacao_cadastral",  # 7
    "nome_cidade_exterior",  # 8
    "pais",  # 9
    "data_inicio_atividade",  # 10
    "cnae_fiscal_principal",  # 11
    "cnae_fiscal_secundaria",  # 12
    "tipo_logradouro",  # 13
    "logradouro",  # 14
    "numero",  # 15
    "complemento",  # 16
    "bairro",  # 17
    "cep",  # 18
    "uf",  # 19
    "municipio",  # 20 código TOM (4 dígitos)
]


def compose_cnpj(basico: str, ordem: str, dv: str) -> str:
    return f"{basico.zfill(8)}{ordem.zfill(4)}{dv.zfill(2)}"


def _iter_estabelecimento_files(directory: Path) -> list[Path]:
    files = sorted(directory.glob("Estabelecimentos*")) + sorted(directory.glob("*.zip"))
    seen: set[Path] = set()
    out: list[Path] = []
    for p in files:
        if p.is_file() and p not in seen:
            seen.add(p)
            out.append(p)
    return out


def _open_text_streams(path: Path):
    if path.suffix.lower() == ".zip":
        with zipfile.ZipFile(path) as zf:
            for name in zf.namelist():
                raw = zf.read(name)
                yield name, io.TextIOWrapper(io.BytesIO(raw), encoding="latin1", newline="")
    else:
        yield path.name, path.open(encoding="latin1", newline="")


def iter_estabelecimento_rows(path: Path):
    """Streaming: cada linha como dict com ESTABELECIMENTO_COLS (todas str)."""
    for _name, fh in _open_text_streams(path):
        with fh:
            reader = csv.reader(fh, delimiter=";")
            for row in reader:
                if not row or all(not c.strip() for c in row):
                    continue
                rec = {col: (row[i] if i < len(row) else "") for i, col in enumerate(ESTABELECIMENTO_COLS)}
                rec["_extra"] = row[len(ESTABELECIMENTO_COLS) :]
                yield rec


def run_cnpj(
    store=None,
    settings: Settings | None = None,
    provider: GeoProvider | None = None,
) -> dict:
    settings = settings or get_settings()
    repo = store or get_repository()
    if not settings.rf_cnpj_dir or not settings.rf_municipios_csv:
        raise ValueError("RF_CNPJ_DIR e RF_MUNICIPIOS_CSV são obrigatórios.")
    rf_map = load_rf_municipio_map(settings.rf_municipios_csv)
    alvos = set(settings.ibge_municipios)
    cache = RepoGeoCache(repo)
    provider = provider or build_providers(settings)
    rows: list[dict] = []
    files = _iter_estabelecimento_files(Path(settings.rf_cnpj_dir))
    t0 = time.perf_counter()
    linhas = 0
    for path in files:
        for rec in iter_estabelecimento_rows(path):
            linhas += 1
            ibge = filter_active_target(
                rec.get("municipio") or "",
                rec.get("situacao_cadastral") or "",
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
                    "cnpj": compose_cnpj(rec["cnpj_basico"], rec["cnpj_ordem"], rec["cnpj_dv"]),
                    "cnae_principal": rec.get("cnae_fiscal_principal") or "",
                    "cnae_secundarias": rec.get("cnae_fiscal_secundaria") or "",
                    "data_inicio": rec.get("data_inicio_atividade") or None,
                    "cep": cep,
                    "h3_index": h3_index,
                    "geo_precisao": geo.precisao,
                    "municipio_ibge": ibge,
                    "lat": geo.lat,
                    "lng": geo.lng,
                }
            )
    repo.replace_empresas(rows)
    precisao: dict[str, int] = {}
    hexes = set()
    mun_count: dict[str, int] = {}
    for r in rows:
        precisao[r["geo_precisao"]] = precisao.get(r["geo_precisao"], 0) + 1
        hexes.add(r["h3_index"])
        mun_count[r["municipio_ibge"]] = mun_count.get(r["municipio_ibge"], 0) + 1
    return {
        "arquivos": [p.name for p in files],
        "linhas_lidas": linhas,
        "empresas_geocodificadas": len(rows),
        "ativos_por_municipio": mun_count,
        "por_municipio": mun_count,
        "geo_precisao": precisao,
        "hexagonos_com_empresas": len(hexes),
        "tempo_s": round(time.perf_counter() - t0, 3),
        "layout": "rf_estabelecimentos_latin1_semicolon_noheader",
        "fonte_layout": "https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos/receitafederal/cadastro-nacional-da-pessoa-juridica-cnpj",
        "consulta": "2026-09-16",
    }
