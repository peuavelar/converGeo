"""Filtro de municípios da Receita Federal via tabela oficial (não hardcoded)."""

from __future__ import annotations

import csv
from pathlib import Path


def load_rf_municipio_map(path: str | Path) -> dict[str, str]:
    """
    Mapeia código TOM/RF (4 dígitos) → código IBGE (7 dígitos).

    Fonte: Tabela de Municípios da Receita Federal
    https://www.gov.br/receitafederal/dados/municipios.csv/view
    Metadados: https://www.gov.br/receitafederal/dados/municipios-metadados.pdf

    Esperado: 1ª coluna TOM, 2ª IBGE (com ou sem cabeçalho).
    """
    mapping: dict[str, str] = {}
    with Path(path).open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.reader(fh, delimiter=";")
        for row in reader:
            if len(row) < 2:
                continue
            tom, ibge = row[0].strip(), row[1].strip()
            if not tom or not ibge.isdigit() or len(ibge) != 7:
                continue
            mapping[tom.zfill(4)] = ibge
    return mapping


def filter_active_target(
    municipio_rf: str,
    situacao: str,
    ibge_alvos: set[str],
    rf_to_ibge: dict[str, str],
) -> str | None:
    sit = situacao.strip()
    if sit not in {"02", "2"}:
        return None
    ibge = rf_to_ibge.get(municipio_rf.strip().zfill(4))
    if ibge in ibge_alvos:
        return ibge
    return None
