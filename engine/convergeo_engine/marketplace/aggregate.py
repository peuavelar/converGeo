"""Agrega precos_hex com fallback hexágono → k-ring 1 → bairro → município."""

from __future__ import annotations

from statistics import median

import h3

from convergeo_engine.config import get_settings
from convergeo_engine.store import MemoryStore, get_store


def _ppm2(items: list[dict]) -> list[float]:
    return [float(i["preco"]) / float(i["area_util"]) for i in items if i.get("preco") and i.get("area_util")]


def _stats(items: list[dict]) -> dict | None:
    vals = sorted(_ppm2(items))
    if not vals:
        return None
    n = len(vals)

    def pct(p: float) -> float:
        k = (n - 1) * p
        f = int(k)
        c = min(f + 1, n - 1)
        return vals[f] if f == c else vals[f] + (vals[c] - vals[f]) * (k - f)

    return {
        "mediana_m2": median(vals),
        "p25_m2": pct(0.25),
        "p75_m2": pct(0.75),
        "n": n,
        "estoque_ativo": len(items),
    }


def aggregate(store: MemoryStore | None = None, min_n: int | None = None) -> list[dict]:
    settings = get_settings()
    store = store or get_store()
    min_n = min_n or settings.min_bucket_n
    ativos = [i for i in store.imoveis if i.get("status") == "ativo"]
    out: list[dict] = []
    keys = {(i.get("h3_index"), i.get("finalidade"), i.get("tipo")) for i in ativos if i.get("h3_index")}
    by_city = {}
    by_bairro = {}
    for i in ativos:
        by_city.setdefault((i.get("endereco_cidade"), i.get("finalidade"), i.get("tipo")), []).append(i)
        by_bairro.setdefault((i.get("endereco_bairro"), i.get("finalidade"), i.get("tipo")), []).append(i)

    for h3_index, finalidade, tipo in keys:
        hex_items = [
            i
            for i in ativos
            if i.get("h3_index") == h3_index and i.get("finalidade") == finalidade and i.get("tipo") == tipo
        ]
        nivel = "hexagono"
        chosen = hex_items
        st = _stats(hex_items)
        if not st or st["n"] < min_n:
            ring = []
            try:
                neighbors = h3.grid_disk(h3_index, 1)
            except Exception:
                neighbors = [h3_index]
            ring = [
                i
                for i in ativos
                if i.get("h3_index") in neighbors
                and i.get("finalidade") == finalidade
                and i.get("tipo") == tipo
            ]
            st = _stats(ring)
            nivel, chosen = "k_ring_1", ring
        if not st or st["n"] < min_n:
            bairro = hex_items[0].get("endereco_bairro") if hex_items else None
            chosen = by_bairro.get((bairro, finalidade, tipo), [])
            st = _stats(chosen)
            nivel = "bairro"
        if not st or st["n"] < min_n:
            city = hex_items[0].get("endereco_cidade") if hex_items else None
            chosen = by_city.get((city, finalidade, tipo), [])
            st = _stats(chosen)
            nivel = "municipio"
        if not st:
            continue
        out.append(
            {
                "h3_index": h3_index,
                "finalidade": finalidade,
                "tipologia": tipo,
                **st,
                "dias_mercado_mediana": None,
                "nivel_fallback": nivel,
            }
        )
    store.precos_hex = out
    return out
