"""IBGE: rateio por área geodésica + renda real (nunca densidade como proxy)."""

from __future__ import annotations

import csv
import json
from pathlib import Path

from shapely.geometry import shape
from shapely.strtree import STRtree

from convergeo_engine.config import Settings, get_settings
from convergeo_engine.geo import area_apportion, geodesic_area_m2, hex_polygon
from convergeo_engine.store import get_repository

RENDA_FONTE_2022 = "censo_2022_rendimento_responsavel_setor"
RENDA_ANO_2022 = 2022


def run_ibge(store=None, settings: Settings | None = None) -> dict:
    settings = settings or get_settings()
    repo = store or get_repository()
    if not settings.ibge_setores_path:
        raise ValueError("IBGE_SETORES_PATH não definido.")
    data = json.loads(Path(settings.ibge_setores_path).read_text(encoding="utf-8"))
    setores: list[tuple[str, object, float, float]] = []
    renda_por_setor: dict[str, float] = {}
    if settings.ibge_renda_path:
        with Path(settings.ibge_renda_path).open(encoding="utf-8", newline="") as fh:
            for row in csv.DictReader(fh):
                sid = row.get("setor_id") or row.get("CD_SETOR") or ""
                raw = row.get("renda_media") or row.get("V005") or row.get("rendimento") or row.get("V06001")
                if sid and raw:
                    renda_por_setor[sid] = float(str(raw).replace(",", "."))

    setor_geoms = []
    for feat in data["features"]:
        props = feat.get("properties") or {}
        sid = str(props.get("setor_id") or props.get("CD_SETOR") or "")
        pop = float(props.get("populacao") or props.get("V0001") or 0)
        dom = float(props.get("domicilios") or props.get("V0002") or 0)
        geom = shape(feat["geometry"])
        setores.append((sid, geom, pop, dom))
        setor_geoms.append((sid, geom, pop, renda_por_setor.get(sid), props.get("renda_media")))

    hex_rows = repo.list_hexagonos()
    hexes = [(h["h3_index"], hex_polygon(h["h3_index"])) for h in hex_rows]
    apportioned = area_apportion(setores, hexes)

    hex_geoms = [g for _h, g in hexes]
    tree = STRtree(hex_geoms) if hex_geoms else None
    renda_acc: dict[str, list[tuple[float, float]]] = {}
    for sid, setor_g, pop, renda_csv, renda_prop in setor_geoms:
        renda = renda_csv
        if renda is None and renda_prop is not None:
            renda = float(renda_prop)
        if renda is None or setor_g.is_empty:
            continue
        setor_a = geodesic_area_m2(setor_g)
        if setor_a == 0 or tree is None:
            continue
        for idx in tree.query(setor_g):
            h3_index, hex_g = hexes[int(idx)]
            inter = setor_g.intersection(hex_g)
            if inter.is_empty:
                continue
            w = pop * (geodesic_area_m2(inter) / setor_a)
            renda_acc.setdefault(h3_index, []).append((renda, w))

    demo_rows = []
    for rec in apportioned:
        hid = rec["h3_index"]
        pop = rec["populacao"]
        hex_g = hex_polygon(hid)
        area_km2 = geodesic_area_m2(hex_g) / 1_000_000.0
        dens = pop / area_km2 if area_km2 > 0 else 0.0
        weights = renda_acc.get(hid) or []
        if weights:
            num = sum(r * w for r, w in weights)
            den = sum(w for _, w in weights) or 1.0
            renda_media = num / den
            fonte, ano = RENDA_FONTE_2022, RENDA_ANO_2022
        else:
            renda_media, fonte, ano = None, None, None
        demo_rows.append(
            {
                **rec,
                "densidade_hab_km2": round(dens, 4),
                "renda_media": None if renda_media is None else round(renda_media, 2),
                "renda_fonte": fonte,
                "renda_ano_base": ano,
            }
        )
    repo.replace_demografico(demo_rows)
    return {
        "hexagonos_demograficos": len(demo_rows),
        "com_renda": sum(1 for r in demo_rows if r["renda_media"] is not None),
    }
