from __future__ import annotations

import csv
import io
import zipfile
from pathlib import Path

from convergeo_engine.etl.cnpj import ESTABELECIMENTO_COLS, compose_cnpj, iter_estabelecimento_rows


def estabelecimento_line(**kwargs) -> str:
    row = [""] * len(ESTABELECIMENTO_COLS)
    for i, name in enumerate(ESTABELECIMENTO_COLS):
        if name in kwargs:
            row[i] = str(kwargs[name])
    return ";".join(row) + "\n"


def write_oficial_zip(path: Path, rows: list[dict]) -> Path:
    buf = io.StringIO()
    for rec in rows:
        buf.write(estabelecimento_line(**rec))
    raw = buf.getvalue().encode("latin1")
    with zipfile.ZipFile(path, "w") as zf:
        zf.writestr("K3241.K03200Y0.D50913.ESTABELE.csv", raw)
    return path


def test_compose_cnpj_zero_pad():
    assert compose_cnpj("11111111", "1", "91") == "11111111000191"


def test_official_zip_latin1_semicolon_no_header(tmp_path: Path):
    path = tmp_path / "Estabelecimentos0.zip"
    write_oficial_zip(
        path,
        [
            {
                "cnpj_basico": "11111111",
                "cnpj_ordem": "0001",
                "cnpj_dv": "91",
                "nome_fantasia": "PADARIA SÃO JORGE",
                "situacao_cadastral": "02",
                "cnae_fiscal_principal": "5611201",
                "tipo_logradouro": "RUA",
                "logradouro": "PITUBA",
                "numero": "10",
                "bairro": "PITUBA",
                "cep": "41810000",
                "uf": "BA",
                "municipio": "3849",
                "data_inicio_atividade": "20180101",
            }
        ],
    )
    recs = list(iter_estabelecimento_rows(path))
    assert recs[0]["nome_fantasia"] == "PADARIA SÃO JORGE"
    assert recs[0]["situacao_cadastral"] == "02"
    assert recs[0]["municipio"] == "3849"
    # O leitor antigo (DictReader UTF-8 com cabeçalho) usaria a 1ª linha como nomes.
    text = zipfile.ZipFile(path).read("K3241.K03200Y0.D50913.ESTABELE.csv").decode("latin1")
    reader = csv.DictReader(io.StringIO(text))
    assert "cnpj" not in (reader.fieldnames or [])
