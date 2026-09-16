from pathlib import Path

from convergeo_engine.config import Settings
from convergeo_engine.etl.cnpj import run_cnpj
from convergeo_engine.etl.grade import run_grade
from convergeo_engine.geo import geocode_with_fallback, MemoryGeoCache
from convergeo_engine.store import MemoryStore

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


def test_cnpj_reads_all_estabelecimentos_files():
    store = MemoryStore()
    settings = Settings(
        rf_cnpj_dir=str(ROOT / "cnpj"),
        rf_municipios_csv=str(ROOT / "municipios_rf.csv"),
    )
    out = run_cnpj(store, settings, provider=MapProvider())
    assert "Estabelecimentos0.csv" in out["arquivos"]
    assert "Estabelecimentos1.csv" in out["arquivos"]
    assert out["empresas_geocodificadas"] >= 4
    assert out["hexagonos_com_empresas"] >= 1
    assert "3550308" not in out["por_municipio"]
