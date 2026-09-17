import pytest
from fastapi.testclient import TestClient

from convergeo_engine.api.app import app
from convergeo_engine.config import get_settings
from convergeo_engine.security import assert_production_secrets
from convergeo_engine.store import reset_store

ADMIN = "k" * 32


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("ENGINE_ADMIN_KEY", ADMIN)
    get_settings.cache_clear()
    reset_store()
    yield TestClient(app)
    get_settings.cache_clear()


def test_ingest_sem_chave_401(client):
    csv_body = "id_externo,finalidade,tipo,preco,area_util,status\nx1,venda,apartamento,1,10,ativo\n"
    res = client.post(
        "/v2/ingest/planilha",
        params={"anunciante_id": "a1"},
        files={"file": ("imoveis.csv", csv_body, "text/csv")},
    )
    assert res.status_code == 401


def test_anunciante_a_nao_ingere_em_b(client):
    a = client.post("/v2/anunciantes", json={"nome": "A"}, headers={"X-API-Key": ADMIN}).json()
    b = client.post("/v2/anunciantes", json={"nome": "B"}, headers={"X-API-Key": ADMIN}).json()
    csv_body = "id_externo,finalidade,tipo,preco,area_util,status\nx1,venda,apartamento,1,10,ativo\n"
    res = client.post(
        "/v2/ingest/planilha",
        params={"anunciante_id": b["anunciante"]["id"]},
        files={"file": ("imoveis.csv", csv_body, "text/csv")},
        headers={"X-API-Key": a["api_key"]},
    )
    assert res.status_code in {401, 403}


def test_chave_errada_mesmo_tamanho_401(client):
    created = client.post("/v2/anunciantes", json={"nome": "A"}, headers={"X-API-Key": ADMIN}).json()
    wrong = ("z" * len(created["api_key"]))
    csv_body = "id_externo,finalidade,tipo,preco,area_util,status\nx1,venda,apartamento,1,10,ativo\n"
    res = client.post(
        "/v2/ingest/planilha",
        params={"anunciante_id": created["anunciante"]["id"]},
        files={"file": ("imoveis.csv", csv_body, "text/csv")},
        headers={"X-API-Key": wrong},
    )
    assert res.status_code == 401


def test_producao_recusa_admin_curta(monkeypatch):
    monkeypatch.setenv("ENGINE_ENV", "production")
    monkeypatch.setenv("ENGINE_ADMIN_KEY", "curta")
    get_settings.cache_clear()
    with pytest.raises(RuntimeError):
        assert_production_secrets()
    monkeypatch.delenv("ENGINE_ENV", raising=False)
    get_settings.cache_clear()
