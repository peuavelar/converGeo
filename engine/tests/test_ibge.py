from convergeo_engine.config import Settings
from convergeo_engine.etl.grade import run_grade
from convergeo_engine.etl.ibge import run_ibge
from convergeo_engine.store import MemoryStore
from pathlib import Path

ROOT = Path(__file__).parent / "fixtures"


def test_ibge_apportion_and_real_income():
    store = MemoryStore()
    settings = Settings(
        ibge_malha_path=str(ROOT / "malha_mini.geojson"),
        ibge_setores_path=str(ROOT / "setores_mini.geojson"),
        h3_resolution=8,
        min_land_area_frac=0.15,
    )
    run_grade(store, settings)
    out = run_ibge(store, settings)
    assert out["hexagonos_demograficos"] >= 1
    assert out["com_renda"] >= 1
    assert all(r.get("renda_fonte") != "densidade" for r in store.demografico)
