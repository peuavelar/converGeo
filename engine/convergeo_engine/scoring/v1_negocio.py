"""Score v1 (Negócio) para todos os segmentos do front.

Camadas oficiais (IBGE / Receita) ficam None até o ETL correspondente.
Com OSM, só a camada comportamental entra e o total é renormalizado.
"""

from __future__ import annotations

from collections import defaultdict

from convergeo_engine.scoring import combine
from convergeo_engine.segments import OSM_POR_SEGMENTO, PESOS_V1, SEGMENTOS
from convergeo_engine.store import MemoryStore, get_store


def scale_counts_0_10(values: list[float]) -> list[float]:
    """Min-max sem winsorize — POIs são esparsos; o p95 seria zero."""
    if not values:
        return []
    lo, hi = min(values), max(values)
    if hi == lo:
        return [5.0 for _ in values]
    return [round(10.0 * (v - lo) / (hi - lo), 4) for v in values]


def _poi_counts(store: MemoryStore) -> dict[str, dict[str, int]]:
    """hex -> categoria OSM -> n."""
    out: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for poi in store.osm_pois:
        h = poi.get("h3_index")
        cat = poi.get("categoria")
        if h and cat:
            out[str(h)][str(cat)] += 1
    return out


def _raw_comportamental(
    hexes: list[str],
    counts: dict[str, dict[str, int]],
    cats: frozenset[str],
) -> list[float]:
    rows = []
    for h in hexes:
        bag = counts.get(h) or {}
        rows.append(float(sum(n for cat, n in bag.items() if cat in cats)))
    return rows


def compute_v1_negocio(store: MemoryStore | None = None) -> dict:
    store = store or get_store()
    hexes = [str(h["h3_index"]) for h in store.hexagonos if h.get("h3_index")]
    counts = _poi_counts(store)
    n_scores = 0
    por_segmento: dict[str, int] = {}

    for segmento in SEGMENTOS:
        cats = OSM_POR_SEGMENTO[segmento]
        raw = _raw_comportamental(hexes, counts, cats)
        scaled = scale_counts_0_10(raw)
        wrote = 0
        for h3_index, comp in zip(hexes, scaled):
            layers = {
                "estrutural": None,
                "macroeconomico": None,
                "comportamental": comp,
            }
            total, _cob = combine(layers, PESOS_V1)
            if total is None:
                continue
            store.upsert_score(
                {
                    "h3_index": h3_index,
                    "segmento": segmento,
                    "score_estrutural": None,
                    "score_macroeconomico": None,
                    "score_comportamental": comp,
                    "score_total": total,
                    "fonte": "osm_comportamental",
                }
            )
            n_scores += 1
            wrote += 1
        por_segmento[segmento] = wrote

    return {
        "hexagonos": len(hexes),
        "scores": n_scores,
        "segmentos": por_segmento,
        "camadas": {
            "estrutural": False,
            "macroeconomico": False,
            "comportamental": True,
        },
        "fonte": "osm_comportamental",
    }
