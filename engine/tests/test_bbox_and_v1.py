from convergeo_engine.etl.bbox_grade import run_bbox_grade
from convergeo_engine.etl.osm import parse_overpass
from convergeo_engine.scoring.v1_negocio import compute_v1_negocio
from convergeo_engine.segments import SEGMENTOS
from convergeo_engine.store import MemoryStore


def test_bbox_grade_salvador_res8():
    store = MemoryStore()
    out = run_bbox_grade(store)
    assert out["hexagonos"] >= 80
    assert out["municipios"] == ["2927408"]
    assert all(h["fonte"] == "bbox_salvador" for h in store.hexagonos)
    assert all(h["h3_index"].startswith("88") for h in store.hexagonos)


def test_v1_scores_all_segments_from_osm():
    store = MemoryStore()
    run_bbox_grade(store)
    # Pituba + um hex de comida vs um de farmácia
    origin = store.hexagonos[0]
    other = store.hexagonos[10]
    store.replace_osm(
        parse_overpass(
            {
                "elements": [
                    {
                        "type": "node",
                        "id": 1,
                        "lat": origin["lat"],
                        "lon": origin["lng"],
                        "tags": {"amenity": "restaurant", "name": "A"},
                    },
                    {
                        "type": "node",
                        "id": 2,
                        "lat": origin["lat"],
                        "lon": origin["lng"],
                        "tags": {"amenity": "restaurant"},
                    },
                    {
                        "type": "node",
                        "id": 3,
                        "lat": other["lat"],
                        "lon": other["lng"],
                        "tags": {"amenity": "pharmacy"},
                    },
                ]
            }
        )
    )
    result = compute_v1_negocio(store)
    assert result["segmentos"].keys() == set(SEGMENTOS)
    assert result["scores"] == len(store.hexagonos) * len(SEGMENTOS)
    food = [s for s in store.scores if s["segmento"] == "food_service"]
    farm = [s for s in store.scores if s["segmento"] == "farmacia"]
    top_food = max(food, key=lambda s: s["score_total"])
    assert top_food["h3_index"] == origin["h3_index"]
    top_farm = max(farm, key=lambda s: s["score_total"])
    assert top_farm["h3_index"] == other["h3_index"]
    assert all(s["score_estrutural"] is None for s in store.scores)
    assert all(s["fonte"] == "osm_comportamental" for s in store.scores)
