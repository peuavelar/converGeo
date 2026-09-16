"""Normalização robusta e score imobiliário v2."""

from __future__ import annotations

from pathlib import Path
from statistics import mean
from typing import Iterable

import yaml

from convergeo_engine.config import ENGINE_ROOT

PROFILES_PATH = ENGINE_ROOT / "convergeo_engine" / "scoring" / "perfis.yaml"


def load_profiles(path: Path | None = None) -> dict:
    data = yaml.safe_load((path or PROFILES_PATH).read_text(encoding="utf-8"))
    for name, cfg in data["perfis"].items():
        pesos = cfg["pesos"]
        total = sum(pesos.values())
        if abs(total - 1.0) > 1e-6:
            raise ValueError(f"Pesos do perfil {name} somam {total}, esperado 1.")
    return data


def winsorize(values: list[float], lo: float = 0.05, hi: float = 0.95) -> list[float]:
    if not values:
        return []
    ordered = sorted(values)
    p_lo = ordered[int((len(ordered) - 1) * lo)]
    p_hi = ordered[int((len(ordered) - 1) * hi)]
    return [min(max(v, p_lo), p_hi) for v in values]


def scale_0_10(values: list[float | None]) -> list[float | None]:
    present = [v for v in values if v is not None]
    if len(present) < 2:
        return [5.0 if v is not None else None for v in values]
    w = winsorize(present)
    lo, hi = min(w), max(w)
    if hi == lo:
        return [5.0 if v is not None else None for v in values]
    out: list[float | None] = []
    it = iter(w)
    for v in values:
        if v is None:
            out.append(None)
        else:
            wv = next(it)
            out.append(round(10 * (wv - lo) / (hi - lo), 4))
    return out


def combine(layers: dict[str, float | None], pesos: dict[str, float]) -> tuple[float | None, dict[str, bool]]:
    cobertura = {k: layers.get(k) is not None for k in pesos}
    usable = {k: w for k, w in pesos.items() if cobertura[k]}
    if not usable:
        return None, cobertura
    tot = sum(usable.values())
    score = sum((layers[k] or 0) * (w / tot) for k, w in usable.items())
    return round(score, 4), cobertura


def fair_price_band(desvio_pct: float, below: float, above: float) -> str:
    if desvio_pct <= below:
        return "abaixo"
    if desvio_pct >= above:
        return "acima"
    return "justo"


def estimate_price(
    area_util: float,
    mediana_m2: float,
    *,
    n: int,
    nivel: str,
    below: float,
    above: float,
    preco: float,
) -> dict:
    estimado = mediana_m2 * area_util
    desvio = (preco / estimado - 1.0) if estimado else 0.0
    conf = min(1.0, n / 30) * {
        "hexagono": 1.0,
        "k_ring_1": 0.8,
        "bairro": 0.6,
        "municipio": 0.4,
    }.get(nivel, 0.4)
    return {
        "preco_estimado": round(estimado, 2),
        "desvio_pct": round(desvio, 4),
        "faixa": fair_price_band(desvio, below, above),
        "confianca": round(conf, 3),
        "n": n,
        "nivel_fallback": nivel,
    }
