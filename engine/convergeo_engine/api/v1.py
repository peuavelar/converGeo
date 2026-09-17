from __future__ import annotations

from fastapi import APIRouter, Query, Request

from convergeo_engine.api.models import V1ScoreEmpty, V1ScoreOk, V1TopOk
from convergeo_engine.geo import cell_center, latlng_to_cell
from convergeo_engine.security import rate_limit
from convergeo_engine.store import get_repository

router = APIRouter()


def _demo_flag() -> bool:
    repo = get_repository()
    return bool(getattr(repo, "demo", False))


@router.get("/score")
def get_score(
    request: Request,
    lat: float = Query(...),
    lng: float = Query(...),
    segmento: str = Query("food_service"),
):
    rate_limit(request)
    h3_index = latlng_to_cell(lat, lng)
    repo = get_repository()
    row = repo.get_score(h3_index, segmento)
    if not row:
        body = V1ScoreEmpty(
            h3_index=h3_index,
            mensagem="Região sem dados suficientes ou fora da área de cobertura.",
        ).model_dump()
        if _demo_flag():
            body["demo"] = True
        return body
    hex_lat, hex_lng = cell_center(row["h3_index"])
    body = V1ScoreOk(
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
        demo=_demo_flag() or None,
    ).model_dump()
    if not body.get("demo"):
        body.pop("demo", None)
    return body


@router.get("/top")
def get_top(
    request: Request,
    segmento: str = Query("food_service"),
    limit: int = Query(5),
):
    rate_limit(request)
    repo = get_repository()
    rows = repo.top_scores(segmento, limit)
    if not rows:
        body = {"status": "sem_dados", "mensagem": f"Sem dados para o segmento {segmento}"}
        if _demo_flag():
            body["demo"] = True
        return body
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
    body = V1TopOk(segmento=segmento, recomendacoes=recs, demo=_demo_flag() or None).model_dump()
    if not body.get("demo"):
        body.pop("demo", None)
    return body
