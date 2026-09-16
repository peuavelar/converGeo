import pytest
from fastapi.testclient import TestClient

from convergeo_engine.api.app import app
from convergeo_engine.store import reset_store


@pytest.fixture(autouse=True)
def seed_scores():
    store = reset_store()
    store.upsert_score(
        {
            "h3_index": "888116db69fffff",
            "segmento": "food_service",
            "score_estrutural": 7.1,
            "score_macroeconomico": 8.2,
            "score_comportamental": 6.0,
            "score_total": 7.4,
        }
    )
    yield


def test_health_and_v1_contract():
    client = TestClient(app)
    h = client.get("/health")
    assert h.status_code == 200
    assert h.json()["status"] == "ok"

    top = client.get("/top", params={"segmento": "food_service", "limit": 5})
    body = top.json()
    assert body["status"] == "sucesso"
    rec = body["recomendacoes"][0]
    assert "h3_index" in rec and "breakdown" in rec
    assert set(rec["breakdown"]) == {"estrutural", "macroeconomico", "comportamental"}

    miss = client.get("/score", params={"lat": -12.0, "lng": -38.0, "segmento": "food_service"})
    assert miss.json()["status"] in {"sucesso", "sem_dados"}
    assert "h3_index" in miss.json()
