"""Score imobiliário v2 a partir das camadas ETL (amenidade macro positiva)."""

from __future__ import annotations

from collections import defaultdict

import h3

from convergeo_engine.scoring import combine, load_profiles, scale_0_10
from convergeo_engine.store import get_repository

CNAE_FAMILIAS = {
    "saude": ("86", "87"),
    "educacao": ("85",),
    "comercio": ("47",),
    "essencial": ("64", "65", "66"),
    "gastronomia": ("56",),
}


def _empresa_weight(e: dict, bairro_weight: float) -> float:
    return bairro_weight if e.get("geo_precisao") == "bairro" else 1.0


def _macro_counts(empresas: list[dict], bairro_weight: float) -> dict[str, float]:
    """O(empresas): soma ponderada por hexágono, depois vizinhos via grid_disk."""
    by_hex: dict[str, float] = defaultdict(float)
    for e in empresas:
        hid = e.get("h3_index")
        if not hid:
            continue
        cnae = str(e.get("cnae_principal") or "")[:2]
        fam = 0.0
        for prefixes in CNAE_FAMILIAS.values():
            if any(cnae.startswith(p) for p in prefixes):
                fam += 1.0
        by_hex[hid] += (1.0 + fam) * _empresa_weight(e, bairro_weight)
    return dict(by_hex)


def _macro_for_hex(counts: dict[str, float], h3_index: str) -> float | None:
    try:
        ring = h3.grid_disk(h3_index, 1)
    except Exception:
        ring = [h3_index]
    total = 0.0
    hit = False
    for n in ring:
        if n in counts:
            total += counts[n]
            hit = True
    return total if hit else None


def _apply_direcao(value: float | None, direcao: str) -> float | None:
    if value is None:
        return None
    if direcao == "negativa":
        return round(10.0 - value, 4)
    return value


def compute_scores_v2(store=None, bairro_weight: float = 0.4) -> int:
    repo = store or get_repository()
    profiles = load_profiles()
    hexes = [h["h3_index"] for h in repo.list_hexagonos()] or list(
        {d["h3_index"] for d in repo.list_demografico()}
    )
    demo = {d["h3_index"]: d for d in repo.list_demografico()}
    pois_by_hex: dict[str, int] = defaultdict(int)
    for p in repo.list_osm():
        if p.get("h3_index"):
            pois_by_hex[p["h3_index"]] += 1
    mercado_by_hex = {p["h3_index"]: p for p in repo.list_precos_hex()}
    macro_counts = _macro_counts(repo.list_empresas(), bairro_weight)

    estrutural_raw: list[float | None] = []
    macro_raw: list[float | None] = []
    acess_raw: list[float | None] = []
    mercado_raw: list[float | None] = []
    for hid in hexes:
        d = demo.get(hid)
        if d and d.get("renda_media") is not None:
            estrutural_raw.append(float(d["renda_media"]) + float(d.get("populacao") or 0) * 0.01)
        else:
            estrutural_raw.append(None)
        macro_raw.append(_macro_for_hex(macro_counts, hid))
        acess_raw.append(float(pois_by_hex[hid]) if hid in pois_by_hex else None)
        m = mercado_by_hex.get(hid)
        mercado_raw.append(float(m["mediana_m2"]) if m and m.get("mediana_m2") else None)

    estrutural = scale_0_10(estrutural_raw)
    macro = scale_0_10(macro_raw)
    acess = scale_0_10(acess_raw)
    mercado = scale_0_10(mercado_raw)

    out = []
    for i, hid in enumerate(hexes):
        base = {
            "estrutural": estrutural[i],
            "macroeconomica": macro[i],
            "acessibilidade": acess[i],
            "mercado": mercado[i],
        }
        for perfil, cfg in profiles["perfis"].items():
            camadas_cfg = cfg.get("camadas") or {}
            layers = {
                k: _apply_direcao(v, (camadas_cfg.get(k) or {}).get("direcao", "positiva"))
                for k, v in base.items()
            }
            total, cobertura = combine(layers, cfg["pesos"])
            out.append(
                {
                    "h3_index": hid,
                    "perfil": perfil,
                    "score_total": total,
                    **layers,
                    "cobertura": cobertura,
                    "versao": "v2",
                }
            )
    repo.replace_scores_imobiliario(out)
    return len(out)
