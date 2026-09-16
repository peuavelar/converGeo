"""Dados de demonstração para localhost (sem Postgres / sem zips oficiais)."""

from __future__ import annotations

import hashlib

import h3

from convergeo_engine.geo import latlng_to_cell
from convergeo_engine.marketplace.aggregate import aggregate
from convergeo_engine.marketplace.seed import seed_from_csv
from convergeo_engine.scoring.compute import compute_scores_v2
from convergeo_engine.store import MemoryStore, get_store

# Núcleos reais de Salvador / Lauro (centróides aproximados de bairro).
CENTERS: list[tuple[float, float]] = [
    (-13.0018, -38.4631),  # Pituba
    (-13.0100, -38.5310),  # Barra
    (-13.0098, -38.4865),  # Rio Vermelho
    (-12.9764, -38.4609),  # Caminho das Árvores
    (-12.9328, -38.4235),  # Imbuí
    (-12.9165, -38.4168),  # Paralela
    (-12.9416, -38.3571),  # Itapuã
    (-12.8940, -38.3270),  # Lauro de Freitas
]

SEGMENTS = [
    "food_service",
    "padaria",
    "cafe",
    "farmacia",
    "clinica",
    "otica",
    "academia",
    "beleza",
    "vestuario",
    "supermercado",
    "pet",
    "papelaria",
    "construcao",
    "posto",
    "hotel",
    "educacao",
    "imobiliaria",
]


def _unit(key: str) -> float:
    digest = hashlib.sha256(key.encode()).digest()
    return digest[0] / 255.0


def seed_demo(store: MemoryStore | None = None) -> dict:
    store = store or get_store()
    if store.scores:
        return {"skipped": True, "hexagonos": len(store.hexagonos), "scores": len(store.scores)}

    cells: set[str] = set()
    for lat, lng in CENTERS:
        origin = h3.latlng_to_cell(lat, lng, 8)
        cells.update(h3.grid_disk(origin, 3))

    hexes = []
    demo = []
    empresas = []
    pois = []
    for cell in cells:
        lat, lng = h3.cell_to_latlng(cell)
        mun = "2919207" if lng > -38.36 else "2927408"
        hexes.append(
            {
                "h3_index": cell,
                "municipio_ibge": mun,
                "pct_area_terrestre": 1.0,
                "lat": lat,
                "lng": lng,
            }
        )
        renda = 1800 + 5200 * _unit(f"renda-{cell}")
        pop = 400 + 1800 * _unit(f"pop-{cell}")
        demo.append(
            {
                "h3_index": cell,
                "populacao": round(pop, 1),
                "domicilios": round(pop / 2.6, 1),
                "densidade_hab_km2": round(pop * 12, 1),
                "renda_media": round(renda, 2),
                "renda_fonte": "demo_localhost",
                "renda_ano_base": 2022,
            }
        )
        empresas.append(
            {
                "cnpj": f"demo-{cell[-8:]}",
                "cnae_principal": "5611201",
                "h3_index": cell,
                "geo_precisao": "endereco",
                "municipio_ibge": mun,
                "lat": lat,
                "lng": lng,
            }
        )
        pois.append(
            {
                "osm_id": f"demo/{cell}",
                "categoria": "school",
                "nome": "POI demo",
                "lat": lat,
                "lng": lng,
                "h3_index": cell,
            }
        )
        for seg in SEGMENTS:
            estrutural = round(4 + 6 * _unit(f"{seg}-e-{cell}"), 2)
            macro = round(3 + 7 * _unit(f"{seg}-m-{cell}"), 2)
            comp = round(4 + 5 * _unit(f"{seg}-c-{cell}"), 2)
            total = round(0.35 * estrutural + 0.40 * macro + 0.25 * comp, 2)
            store.upsert_score(
                {
                    "h3_index": cell,
                    "segmento": seg,
                    "score_estrutural": estrutural,
                    "score_macroeconomico": macro,
                    "score_comportamental": comp,
                    "score_total": total,
                }
            )

    store.replace_hexagonos(hexes)
    store.replace_demografico(demo)
    store.replace_empresas(empresas)
    store.replace_osm(pois)

    ingest = seed_from_csv(store=store)
    for im in store.imoveis:
        if im.get("lat") is not None and im.get("lng") is not None:
            im["h3_index"] = latlng_to_cell(float(im["lat"]), float(im["lng"]))
            im["geo_precisao"] = "endereco"
    precos = aggregate(store, min_n=1)
    n_v2 = compute_scores_v2(store)
    return {
        "hexagonos": len(hexes),
        "scores_v1": len(store.scores),
        "imoveis": ingest.get("total"),
        "precos_hex": len(precos),
        "scores_v2": n_v2,
        "demo": True,
    }
