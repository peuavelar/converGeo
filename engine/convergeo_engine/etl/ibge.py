"""IBGE: rateio por área + renda real (nunca densidade como proxy)."""

from __future__ import annotations

import csv
import json
from pathlib import Path

from shapely.geometry import shape

from convergeo_engine.config import Settings, get_settings
from convergeo_engine.geo import area_apportion, hex_polygon
from convergeo_engine.store import MemoryStore, get_store

# Censo 2022 — rendimento do responsável por setor:
# http://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios_Rendimento_do_Responsavel/
RENDA_FONTE_2022 = "censo_2022_rendimento_responsavel_setor"
RENDA_ANO_2022 = 2022


def run_ibge(store: MemoryStore | None = None, settings: Settings | None = None) -> dict:
    settings = settings or get_settings()
    store = store or get_store()
    if not settings.ibge_setores_path:
        raise ValueError("IBGE_SETORES_PATH não definido.")
    data = json.loads(Path(settings.ibge_setores_path).read_text(encoding="utf-8"))
    setores: list[tuple[str, object, float, float]] = []
    renda_por_setor: dict[str, float] = {}
    if settings.ibge_renda_path:
        with Path(settings.ibge_renda_path).open(encoding="utf-8", newline="") as fh:
            for row in csv.DictReader(fh):
                sid = row.get("setor_id") or row.get("CD_SETOR") or ""
                raw = row.get("renda_media") or row.get("V005") or row.get("rendimento")
                if sid and raw:
                    renda_por_setor[sid] = float(raw)

    for feat in data["features"]:
        props = feat.get("properties") or {}
        sid = str(props.get("setor_id") or props.get("CD_SETOR") or "")
        pop = float(props.get("populacao") or props.get("V0001") or 0)
        dom = float(props.get("domicilios") or props.get("V0002") or 0)
        setores.append((sid, shape(feat["geometry"]), pop, dom))

    hexes = [(h["h3_index"], hex_polygon(h["h3_index"])) for h in store.hexagonos]
    apportioned = area_apportion(setores, hexes)

    # Renda ponderada pela população rateada do setor (não usar densidade).
    renda_acc: dict[str, list[tuple[float, float]]] = {}
    for feat in data["features"]:
        props = feat.get("properties") or {}
        sid = str(props.get("setor_id") or props.get("CD_SETOR") or "")
        renda = renda_por_setor.get(sid)
        if renda is None:
            raw = props.get("renda_media")
            renda = float(raw) if raw is not None else None
        if renda is None:
            continue
        setor_g = shape(feat["geometry"])
        pop = float(props.get("populacao") or 0)
        if setor_g.area == 0:
            continue
        for h3_index, hex_g in hexes:
            inter = setor_g.intersection(hex_g)
            if inter.is_empty:
                continue
            w = pop * (inter.area / setor_g.area)
            renda_acc.setdefault(h3_index, []).append((renda, w))

    demo_rows = []
    for rec in apportioned:
        hid = rec["h3_index"]
        pop = rec["populacao"]
        hex_g = hex_polygon(hid)
        area_km2 = hex_g.area * 111.32 * 111.32  # graus² → km² aprox. (ADR)
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
    store.replace_demografico(demo_rows)
    return {"hexagonos_demograficos": len(demo_rows), "com_renda": sum(1 for r in demo_rows if r["renda_media"] is not None)}
