"""Score imobiliário v2 a partir das camadas ETL (amenidade macro positiva)."""

from __future__ import annotations

from collections import defaultdict

import h3

from convergeo_engine.scoring import combine, load_profiles, scale_0_10
from convergeo_engine.store import MemoryStore, get_store

CNAE_FAMILIAS = {
    "saude": ("86", "87"),
    "educacao": ("85",),
    "comercio": ("47",),
    "essencial": ("64", "65", "66"),
    "gastronomia": ("56",),
}


def _macro_for_hex(empresas: list[dict], h3_index: str, bairro_weight: float) -> float | None:
    nearby: list[dict] = []
    try:
        ring = set(h3.grid_disk(h3_index, 1))
    except Exception:
        ring = {h3_index}
    for e in empresas:
        if e.get("h3_index") not in ring:
            continue
        w = bairro_weight if e.get("geo_precisao") == "bairro" else 1.0
        nearby.append({**e, "_w": w})
    if not nearby:
        return None
    score = 0.0
    for e in nearby:
        cnae = str(e.get("cnae_principal") or "")[:2]
        fam = 0.0
        for prefixes in CNAE_FAMILIAS.values():
            if any(cnae.startswith(p) for p in prefixes):
                fam += 1.0
        score += (1.0 + fam) * float(e.get("_w") or 1)
    return score


def compute_scores_v2(store: MemoryStore | None = None, bairro_weight: float = 0.4) -> int:
    store = store or get_store()
    profiles = load_profiles()
    hexes = [h["h3_index"] for h in store.hexagonos] or list(
        {d["h3_index"] for d in store.demografico}
    )
    demo = {d["h3_index"]: d for d in store.demografico}
    pois_by_hex: dict[str, int] = defaultdict(int)
    for p in store.osm_pois:
        if p.get("h3_index"):
            pois_by_hex[p["h3_index"]] += 1
    mercado_by_hex = {p["h3_index"]: p for p in store.precos_hex}

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
        macro_raw.append(_macro_for_hex(store.empresas, hid, bairro_weight))
        acess_raw.append(float(pois_by_hex[hid]) if hid in pois_by_hex else None)
        m = mercado_by_hex.get(hid)
        mercado_raw.append(float(m["mediana_m2"]) if m and m.get("mediana_m2") else None)

    estrutural = scale_0_10(estrutural_raw)
    # Amenidade: mais comércio/serviços = nota maior (D8 invertido vs. abrir loja).
    macro = scale_0_10(macro_raw)
    acess = scale_0_10(acess_raw)
    mercado = scale_0_10(mercado_raw)

    out = []
    for i, hid in enumerate(hexes):
        layers = {
            "estrutural": estrutural[i],
            "macroeconomica": macro[i],
            "acessibilidade": acess[i],
            "mercado": mercado[i],
        }
        for perfil, cfg in profiles["perfis"].items():
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
    store.scores_imobiliario = out
    return len(out)
