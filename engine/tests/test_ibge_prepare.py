import json
from pathlib import Path

from convergeo_engine.config import Settings
from convergeo_engine.etl.ibge import run_ibge
from convergeo_engine.etl.ibge_prepare import prepare_ibge
from convergeo_engine.store import MemoryStore

ROOT = Path(__file__).parent / "fixtures"


def test_ibge_prepare_join_and_population_preserved(tmp_path: Path):
    malha = ROOT / "setores_mini.geojson"
    agregados = tmp_path / "agregados.csv"
    renda = tmp_path / "renda.csv"
    saida = tmp_path / "prep.geojson"
    data = json.loads(malha.read_text(encoding="utf-8"))
    rows = []
    rendas = []
    for feat in data["features"]:
        props = feat["properties"]
        sid = props.get("setor_id") or props.get("CD_SETOR")
        rows.append(
            {
                "CD_SETOR": sid,
                "V0001": props.get("populacao") or 0,
                "V0002": props.get("domicilios") or 0,
            }
        )
        if props.get("renda_media") is not None:
            rendas.append({"CD_SETOR": sid, "renda_media": props["renda_media"]})
    agregados.write_text(
        "CD_SETOR,V0001,V0002\n" + "\n".join(f"{r['CD_SETOR']},{r['V0001']},{r['V0002']}" for r in rows),
        encoding="utf-8",
    )
    renda.write_text(
        "CD_SETOR,renda_media\n" + "\n".join(f"{r['CD_SETOR']},{r['renda_media']}" for r in rendas),
        encoding="utf-8",
    )
    settings = Settings(
        ibge_setores_gpkg=str(malha),
        ibge_setores_path=str(saida),
        ibge_agregados_path=str(agregados),
        ibge_renda_path=str(renda),
        ibge_salvador="",
        ibge_lauro="",
    )
    out = prepare_ibge(settings)
    assert out["setores"] >= 1
    prepared = json.loads(saida.read_text(encoding="utf-8"))
    pop_orig = sum(float((f.get("properties") or {}).get("populacao") or 0) for f in data["features"])
    pop_prep = sum(float((f.get("properties") or {}).get("populacao") or 0) for f in prepared["features"])
    assert abs(pop_orig - pop_prep) < 1e-6

    store = MemoryStore()
    from convergeo_engine.etl.grade import run_grade

    run_grade(
        store,
        Settings(ibge_malha_path=str(ROOT / "malha_mini.geojson"), h3_resolution=8, min_land_area_frac=0.15),
    )
    ibge = run_ibge(store, Settings(ibge_setores_path=str(saida)))
    assert ibge["hexagonos_demograficos"] >= 1
    hex_pop = sum(r["populacao"] for r in store.demografico)
    # Rateio preserva soma dentro da interseção com a grade mascarada (tolerância 25%).
    assert hex_pop > 0
    assert hex_pop <= pop_orig * 1.25
