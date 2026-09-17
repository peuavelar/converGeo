from pathlib import Path

from convergeo_engine.config import Settings
from convergeo_engine.etl.cnpj import run_cnpj
from convergeo_engine.etl.grade import run_grade
from convergeo_engine.store import MemoryStore
from tests.test_cnpj_oficial import write_oficial_zip

ROOT = Path(__file__).parent / "fixtures"


class MapProvider:
    def geocode_cep(self, cep: str):
        return (-13.005, -38.46)

    def geocode_endereco(self, query: str):
        return None

    def geocode_bairro(self, bairro: str, municipio: str):
        return (-12.90, -38.33)


def test_etl_grade_masked():
    store = MemoryStore()
    settings = Settings(
        ibge_malha_path=str(ROOT / "malha_mini.geojson"),
        h3_resolution=8,
        min_land_area_frac=0.15,
    )
    result = run_grade(store, settings)
    assert result["hexagonos"] >= 1
    assert set(result["municipios"]) <= {"2927408", "2919207"}


def test_cnpj_reads_official_zips(tmp_path: Path):
    rows_a = [
        {
            "cnpj_basico": "11111111",
            "cnpj_ordem": "0001",
            "cnpj_dv": "91",
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
        },
        {
            "cnpj_basico": "22222222",
            "cnpj_ordem": "0001",
            "cnpj_dv": "72",
            "situacao_cadastral": "02",
            "cnae_fiscal_principal": "4771701",
            "cep": "40140000",
            "uf": "BA",
            "municipio": "3849",
            "bairro": "BARRA",
        },
        {
            "cnpj_basico": "55555555",
            "cnpj_ordem": "0001",
            "cnpj_dv": "15",
            "situacao_cadastral": "08",
            "municipio": "3849",
            "cep": "41810000",
            "cnae_fiscal_principal": "5611201",
        },
    ]
    rows_b = [
        {
            "cnpj_basico": "33333333",
            "cnpj_ordem": "0001",
            "cnpj_dv": "53",
            "situacao_cadastral": "02",
            "cnae_fiscal_principal": "4711302",
            "cep": "42700000",
            "uf": "BA",
            "municipio": "3685",
            "bairro": "CENTRO",
        },
        {
            "cnpj_basico": "44444444",
            "cnpj_ordem": "0001",
            "cnpj_dv": "34",
            "situacao_cadastral": "02",
            "cnae_fiscal_principal": "5611201",
            "cep": "41810000",
            "uf": "BA",
            "municipio": "3849",
            "bairro": "PITUBA",
        },
        {
            "cnpj_basico": "66666666",
            "cnpj_ordem": "0001",
            "cnpj_dv": "96",
            "situacao_cadastral": "02",
            "municipio": "9999",
            "cep": "01001000",
            "cnae_fiscal_principal": "5611201",
        },
    ]
    write_oficial_zip(tmp_path / "Estabelecimentos0.zip", rows_a)
    write_oficial_zip(tmp_path / "Estabelecimentos1.zip", rows_b)
    store = MemoryStore()
    settings = Settings(
        rf_cnpj_dir=str(tmp_path),
        rf_municipios_csv=str(ROOT / "municipios_rf.csv"),
    )
    out = run_cnpj(store, settings, provider=MapProvider())
    assert "Estabelecimentos0.zip" in out["arquivos"]
    assert "Estabelecimentos1.zip" in out["arquivos"]
    assert out["empresas_geocodificadas"] >= 4
    assert out["hexagonos_com_empresas"] >= 1
    assert "3550308" not in out["por_municipio"]
