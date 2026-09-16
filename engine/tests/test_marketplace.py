from convergeo_engine.marketplace.feeds.vrsync import parse_vrsync
from convergeo_engine.marketplace.ingest import ingest_csv, ingest_vrsync
from convergeo_engine.marketplace.quality import (
    discard_iqr_outliers,
    require_price_and_area,
    separate_by_business_type,
)
from convergeo_engine.store import MemoryStore
from pathlib import Path

XML = (Path(__file__).parent / "fixtures" / "vrsync_sample.xml").read_bytes()


def test_separate_sale_rent():
    items = [
        {"finalidade": "venda", "preco": 1, "area_util": 10},
        {"finalidade": "aluguel", "preco": 2, "area_util": 10},
    ]
    assert len(separate_by_business_type(items, "venda")) == 1


def test_require_price_and_area_flags():
    items = [
        {"preco": 100, "area_util": 50, "qualidade_flags": []},
        {"preco": 0, "area_util": 50, "qualidade_flags": []},
    ]
    out = require_price_and_area(items)
    assert "sem_preco_ou_area" in out[1]["qualidade_flags"]


def test_iqr_flags_outliers():
    items = [{"preco": (7000 + i) * 70, "area_util": 70, "qualidade_flags": []} for i in range(10)]
    items.append({"preco": 70, "area_util": 70, "qualidade_flags": []})
    kept, discarded = discard_iqr_outliers(items)
    assert discarded
    assert all("outlier_iqr" in d["qualidade_flags"] for d in discarded)


def test_vrsync_and_price_event():
    store = MemoryStore()
    first = ingest_vrsync("an-1", XML, store)
    assert first["created"] == 1
    xml2 = XML.replace(b"600000", b"650000")
    second = ingest_vrsync("an-1", xml2, store)
    assert second["created"] == 0
    assert second["events"] == 1
    assert len(store.imoveis) == 1
    assert store.imoveis[0]["preco"] == 650000.0
    assert store.imovel_eventos[-1]["evento"] == "preco_alterado"


def test_parse_vrsync_fields():
    rows = parse_vrsync(XML)
    assert rows[0]["id_externo"] == "vr-100"
    assert rows[0]["finalidade"] == "venda"
    assert rows[0]["quartos"] == 2
