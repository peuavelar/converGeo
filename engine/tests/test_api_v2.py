from fastapi.testclient import TestClient

from convergeo_engine.api.app import app
from convergeo_engine.store import reset_store


def test_v2_ingest_and_explain_no_invented_numbers():
    reset_store()
    client = TestClient(app)
    csv_body = (
        "id_externo,finalidade,tipo,preco,area_util,quartos,endereco_bairro,status\n"
        "x1,venda,apartamento,500000,70,2,Pituba,ativo\n"
    )
    res = client.post(
        "/v2/ingest/planilha",
        params={"anunciante_id": "a1"},
        files={"file": ("imoveis.csv", csv_body, "text/csv")},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["created"] == 1

    listed = client.get("/v2/imoveis", params={"finalidade": "venda"})
    assert listed.status_code == 200
    assert listed.json()["imoveis"][0]["id_externo"] == "x1"

    exp = client.post(
        "/v2/explicar",
        json={"explicacao_base": [{"camada": "renda", "valor": 7.2, "peso": 0.3, "presente": True}]},
    )
    assert exp.status_code == 200
    assert "7.2" in exp.json()["texto"]
    assert "99.9" not in exp.json()["texto"]
