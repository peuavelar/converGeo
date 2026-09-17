"""Testes de integração PostGIS. Pule se DATABASE_URL não estiver definido."""

from __future__ import annotations

import os

import pytest

pytestmark = pytest.mark.integration


def _url() -> str:
    return os.environ.get("DATABASE_URL") or os.environ.get("ENGINE_TEST_DATABASE_URL") or ""


@pytest.fixture
def settings(monkeypatch):
    url = _url()
    if not url:
        pytest.skip("DATABASE_URL ausente")
    monkeypatch.setenv("DATABASE_URL", url)
    from convergeo_engine.config import get_settings
    from convergeo_engine.store import reset_store

    get_settings.cache_clear()
    reset_store()
    yield get_settings()
    get_settings.cache_clear()
    reset_store()


def test_migrate_idempotent_and_ignores_legacy(settings):
    from convergeo_engine.db import connection
    from convergeo_engine.migrate import migrate

    with connection(settings) as conn:
        cur = conn.cursor()
        cur.execute("CREATE SCHEMA IF NOT EXISTS convergeo")
        cur.execute(
            """CREATE TABLE IF NOT EXISTS convergeo.scores (
                 h3_index text NOT NULL,
                 segmento text NOT NULL,
                 score_estrutural double precision,
                 score_macroeconomico double precision,
                 score_comportamental double precision,
                 score_total double precision,
                 PRIMARY KEY (h3_index, segmento)
               )"""
        )
        cur.execute(
            """CREATE TABLE IF NOT EXISTS convergeo.hexagonos (
                 legado_only text PRIMARY KEY
               )"""
        )
        cur.execute(
            """SELECT column_name FROM information_schema.columns
               WHERE table_schema='convergeo' AND table_name='hexagonos' ORDER BY 1"""
        )
        before = [r[0] for r in cur.fetchall()]

    first = migrate()
    second = migrate()
    assert second == []
    assert any(name.endswith(".sql") or name.startswith("0") for name in first) or first == []

    with connection(settings) as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT column_name FROM information_schema.columns
               WHERE table_schema='convergeo' AND table_name='hexagonos' ORDER BY 1"""
        )
        after = [r[0] for r in cur.fetchall()]
        assert before == after
        cur.execute(
            "SELECT 1 FROM information_schema.tables WHERE table_schema='convergeo_engine' AND table_name='schema_migrations'"
        )
        assert cur.fetchone()


def test_v1_reads_legacy_scores(settings):
    from fastapi.testclient import TestClient

    from convergeo_engine.api.app import app
    from convergeo_engine.db import connection
    from convergeo_engine.geo import cell_center
    from convergeo_engine.migrate import migrate

    migrate()
    with connection(settings) as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO convergeo.scores
               (h3_index, segmento, score_estrutural, score_macroeconomico, score_comportamental, score_total)
               VALUES ('888116db69fffff','food_service',7.1,8.2,6.0,7.4)
               ON CONFLICT (h3_index, segmento) DO UPDATE SET score_total = EXCLUDED.score_total"""
        )
    client = TestClient(app)
    lat, lng = cell_center("888116db69fffff")
    res = client.get("/score", params={"lat": lat, "lng": lng, "segmento": "food_service"})
    body = res.json()
    assert body["status"] == "sucesso"
    assert set(body["breakdown"]) == {"estrutural", "macroeconomico", "comportamental"}
    top = client.get("/top", params={"segmento": "food_service", "limit": 1}).json()
    assert top["status"] == "sucesso"
    assert "recomendacoes" in top
