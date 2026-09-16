"""Regras de qualidade do marketplace — paridade com lib/benchmarks/rules."""

from __future__ import annotations

from datetime import datetime, timezone
from statistics import median
from typing import Iterable, Literal

BusinessType = Literal["venda", "aluguel"]


def separate_by_business_type(items: list[dict], business_type: BusinessType) -> list[dict]:
    return [i for i in items if i.get("finalidade") == business_type]


def require_price_and_area(items: list[dict]) -> list[dict]:
    out = []
    for i in items:
        price = i.get("preco")
        area = i.get("area_util")
        if isinstance(price, (int, float)) and price > 0 and isinstance(area, (int, float)) and area > 0:
            out.append(i)
        else:
            flags = list(i.get("qualidade_flags") or [])
            flags.append("sem_preco_ou_area")
            i = {**i, "qualidade_flags": flags}
            out.append(i)
    return out


def _area_bucket(area: float) -> int:
    return int(round(area / 5.0) * 5)


def _price_band(price: float) -> int:
    return int(round(price * 0.02 / 100) * 100) if False else int(round(price / (price * 0.02 or 1)))


def dedupe(items: list[dict]) -> list[dict]:
    """Colapsa bairro + área/5m² + preço/2% + finalidade."""
    buckets: dict[tuple, dict] = {}
    for item in items:
        bairro = (item.get("endereco_bairro") or "").strip().lower()
        area = float(item.get("area_util") or 0)
        price = float(item.get("preco") or 0)
        key = (
            bairro,
            _area_bucket(area) if area else 0,
            round(price / max(area, 1) / 50) * 50,
            item.get("finalidade"),
        )
        prev = buckets.get(key)
        if not prev:
            buckets[key] = item
            continue
        # mais recente
        if str(item.get("atualizado_em") or "") > str(prev.get("atualizado_em") or ""):
            buckets[key] = item
    return list(buckets.values())


def percentile(sorted_vals: list[float], p: float) -> float:
    if not sorted_vals:
        return 0.0
    k = (len(sorted_vals) - 1) * (p / 100)
    f = int(k)
    c = min(f + 1, len(sorted_vals) - 1)
    if f == c:
        return sorted_vals[f]
    return sorted_vals[f] + (sorted_vals[c] - sorted_vals[f]) * (k - f)


def discard_iqr_outliers(items: list[dict]) -> tuple[list[dict], list[dict]]:
    usable = [i for i in items if i.get("preco") and i.get("area_util")]
    ppm2 = sorted(float(i["preco"]) / float(i["area_util"]) for i in usable)
    p25, p75 = percentile(ppm2, 25), percentile(ppm2, 75)
    iqr = p75 - p25
    lo, hi = p25 - 1.5 * iqr, p75 + 1.5 * iqr
    kept, discarded = [], []
    for i in items:
        if not i.get("preco") or not i.get("area_util"):
            kept.append(i)
            continue
        v = float(i["preco"]) / float(i["area_util"])
        if v < lo or v > hi:
            flags = list(i.get("qualidade_flags") or [])
            flags.append("outlier_iqr")
            discarded.append({**i, "qualidade_flags": flags})
        else:
            kept.append(i)
    return kept, discarded


def quality_pipeline(items: list[dict], finalidade: BusinessType) -> list[dict]:
    split = separate_by_business_type(items, finalidade)
    split = require_price_and_area(split)
    split = dedupe(split)
    kept, discarded = discard_iqr_outliers(split)
    return kept + discarded
