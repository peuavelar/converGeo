from pathlib import Path

from convergeo_engine.etl.rf_municipios import filter_active_target, load_rf_municipio_map

FIXTURE = Path(__file__).parent / "fixtures" / "municipios_rf.csv"


def test_rf_map_from_official_table_shape():
    mapping = load_rf_municipio_map(FIXTURE)
    assert mapping["3849"] == "2927408"
    assert mapping["3685"] == "2919207"
    assert mapping["9999"] == "3550308"


def test_filter_active_target_municipios():
    mapping = load_rf_municipio_map(FIXTURE)
    alvos = {"2927408", "2919207"}
    assert filter_active_target("3849", "02", alvos, mapping) == "2927408"
    assert filter_active_target("3685", "02", alvos, mapping) == "2919207"
    assert filter_active_target("3849", "08", alvos, mapping) is None
    assert filter_active_target("9999", "02", alvos, mapping) is None
