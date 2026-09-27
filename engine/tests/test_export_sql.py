from convergeo_engine.etl.bbox_grade import run_bbox_grade
from convergeo_engine.export_sql import export_hex_sql
from convergeo_engine.store import MemoryStore


def test_export_hex_sql_has_insert():
    store = MemoryStore()
    run_bbox_grade(store)
    sql = export_hex_sql(store)
    assert "INSERT INTO convergeo.hexagonos" in sql
    assert store.hexagonos[0]["h3_index"] in sql
    assert "ST_GeomFromText" in sql
