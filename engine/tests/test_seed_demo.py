from convergeo_engine.seed_demo import seed_demo
from convergeo_engine.store import MemoryStore


def test_seed_demo_fills_negocio_and_marketplace():
    store = MemoryStore()
    out = seed_demo(store)
    assert out["hexagonos"] >= 50
    assert out["scores_v1"] > 100
    assert any(s["segmento"] == "food_service" for s in store.scores)
    assert store.imoveis
    again = seed_demo(store)
    assert again.get("skipped") is True
