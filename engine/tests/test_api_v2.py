from fastapi.testclient import TestClient

from convergeo_engine.api.app import app
from convergeo_engine.config import get_settings
from convergeo_engine.store import reset_store

ADMIN = "k" * 32


def test_v2_ingest_and_explain_no_invented_numbers(monkeypatch):
    monkeypatch.setenv("ENGINE_ADMIN_KEY", ADMIN)
    get_settings.cache_clear()
    reset_store()
    client = TestClient(app)
    created = client.post(
        "/v2/anunciantes",
        json={"nome": "Imob Teste"},
        headers={"X-API-Key": ADMIN},
    )
    assert created.status_code == 200
    aid = created.json()["anunciante"]["id"]
    key = created.json()["api_key"]
    csv_body = (
        "id_externo,finalidade,tipo,preco,area_util,quartos,endereco_bairro,status\n"
        "x1,venda,apartamento,500000,70,2,Pituba,ativo\n"
    )
    res = client.post(
        "/v2/ingest/planilha",
        params={"anunciante_id": aid},
        files={"file": ("imoveis.csv", csv_body, "text/csv")},
        headers={"X-API-Key": key},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["created"] == 1

    listed = client.get("/v2/imoveis", params={"finalidade": "venda"})
    assert listed.status_code == 200
    ids = [i["id_externo"] for i in listed.json()["imoveis"]]
    assert "x1" in ids

    exp = client.post(
        "/v2/explicar",
        json={"explicacao_base": [{"camada": "renda", "valor": 7.2, "peso": 0.3, "presente": True}]},
    )
    assert exp.status_code == 200
    assert "7.2" in exp.json()["texto"]
    assert "99.9" not in exp.json()["texto"]
    get_settings.cache_clear()
