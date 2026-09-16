from __future__ import annotations

from fastapi import APIRouter, Query

from convergeo_engine.api.models import V1ScoreEmpty, V1ScoreOk, V1TopOk
from convergeo_engine.geo import cell_center, latlng_to_cell
from convergeo_engine.store import get_store

router = APIRouter()


@router.get("/score")
def get_score(
    lat: float = Query(...),
    lng: float = Query(...),
    segmento: str = Query("food_service"),
):
    h3_index = latlng_to_cell(lat, lng)
    store = get_store()
    row = store.get_score(h3_index, segmento)
    if not row:
        return V1ScoreEmpty(
            h3_index=h3_index,
            mensagem="Região sem dados suficientes ou fora da área de cobertura.",
        ).model_dump()
    hex_lat, hex_lng = cell_center(row["h3_index"])
    return V1ScoreOk(
        h3_index=row["h3_index"],
        lat=hex_lat,
        lng=hex_lng,
        segmento=row["segmento"],
        score_total=round(float(row["score_total"]), 2),
        breakdown={
            "estrutural": round(float(row.get("score_estrutural") or 0), 2),
            "macroeconomico": round(float(row.get("score_macroeconomico") or 0), 2),
            "comportamental": round(float(row.get("score_comportamental") or 0), 2),
        },
    ).model_dump()


@router.get("/top")
def get_top(
    segmento: str = Query("food_service"),
    limit: int = Query(5),
):
    store = get_store()
    rows = store.top_scores(segmento, limit)
    if not rows:
        return {"status": "sem_dados", "mensagem": f"Sem dados para o segmento {segmento}"}
    recs = []
    for res in rows:
        hex_lat, hex_lng = cell_center(res["h3_index"])
        recs.append(
            {
                "h3_index": res["h3_index"],
                "lat": hex_lat,
                "lng": hex_lng,
                "score_total": round(float(res["score_total"]), 2),
                "breakdown": {
                    "estrutural": round(float(res.get("score_estrutural") or 0), 2),
                    "macroeconomico": round(float(res.get("score_macroeconomico") or 0), 2),
                    "comportamental": round(float(res.get("score_comportamental") or 0), 2),
                },
            }
        )
    return V1TopOk(segmento=segmento, recomendacoes=recs).model_dump()
