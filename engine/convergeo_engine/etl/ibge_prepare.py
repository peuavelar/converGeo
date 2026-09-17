"""Junta malha de setores (GPKG/SHP/GeoJSON) com agregados e renda (CSV)."""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

import yaml
from shapely.geometry import mapping, shape

from convergeo_engine.config import ENGINE_ROOT, Settings, get_settings

# Consulta dicionários: ver ibge_colunas.yaml (2026-09-16).


def _pick(row: dict[str, Any], aliases: list[str]) -> Any:
    lower = {str(k).lower(): v for k, v in row.items()}
    for alias in aliases:
        if alias in row and row[alias] not in (None, ""):
            return row[alias]
        if alias.lower() in lower and lower[alias.lower()] not in (None, ""):
            return lower[alias.lower()]
    return None


def load_colunas(path: str | Path | None = None) -> dict:
    p = Path(path) if path else ENGINE_ROOT / "convergeo_engine" / "etl" / "ibge_colunas.yaml"
    return yaml.safe_load(p.read_text(encoding="utf-8"))


def _read_csv_table(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def _read_features(path: Path) -> list[dict]:
    suffix = path.suffix.lower()
    if suffix in {".gpkg", ".shp"}:
        import fiona

        feats = []
        with fiona.open(path) as src:
            for feat in src:
                geom = feat.get("geometry")
                props = dict(feat.get("properties") or {})
                feats.append({"type": "Feature", "geometry": geom, "properties": props})
        return feats
    data = json.loads(path.read_text(encoding="utf-8"))
    return list(data.get("features") or [])


def _norm_setor(val: Any) -> str:
    return "".join(ch for ch in str(val or "") if ch.isdigit() or ch.isalnum())


def prepare_ibge(settings: Settings | None = None) -> dict:
    settings = settings or get_settings()
    malha = settings.ibge_setores_gpkg or settings.ibge_setores_path
    if not malha:
        raise ValueError("IBGE_SETORES_GPKG ou IBGE_SETORES_PATH é obrigatório para ibge-prepare.")
    cols = load_colunas(settings.ibge_colunas_yaml or None)
    features = _read_features(Path(malha))
    alvos = {c for c in settings.ibge_municipios if c}

    pop_map: dict[str, dict] = {}
    if settings.ibge_agregados_path:
        for row in _read_csv_table(Path(settings.ibge_agregados_path)):
            sid = _norm_setor(_pick(row, cols["setor_id"]))
            if sid:
                pop_map[sid] = row

    renda_map: dict[str, dict] = {}
    if settings.ibge_renda_path:
        for row in _read_csv_table(Path(settings.ibge_renda_path)):
            sid = _norm_setor(_pick(row, cols["setor_id"]))
            if sid:
                renda_map[sid] = row

    out_feats = []
    sem_agregado = 0
    sem_renda = 0
    sem_malha_join = 0
    for feat in features:
        props = dict(feat.get("properties") or {})
        mun = str(_pick(props, cols.get("municipio") or []) or "")
        if alvos and mun and mun not in alvos:
            continue
        sid = _norm_setor(_pick(props, cols["setor_id"]))
        agr = pop_map.get(sid)
        if agr:
            pop = _pick(agr, cols["populacao"])
            dom = _pick(agr, cols["domicilios"])
            if pop is not None:
                props["populacao"] = float(str(pop).replace(",", "."))
            if dom is not None:
                props["domicilios"] = float(str(dom).replace(",", "."))
        else:
            sem_agregado += 1
            if _pick(props, cols["populacao"]) is not None:
                props["populacao"] = float(str(_pick(props, cols["populacao"])).replace(",", "."))
            if _pick(props, cols["domicilios"]) is not None:
                props["domicilios"] = float(str(_pick(props, cols["domicilios"])).replace(",", "."))
        rend = renda_map.get(sid)
        raw_r = _pick(rend, cols["renda"]) if rend else _pick(props, cols["renda"])
        if raw_r is not None:
            props["renda_media"] = float(str(raw_r).replace(",", "."))
        else:
            sem_renda += 1
        props["CD_SETOR"] = sid
        geom = feat.get("geometry")
        if geom and not isinstance(geom, dict):
            geom = mapping(shape(geom))
        out_feats.append({"type": "Feature", "geometry": geom, "properties": props})

    agregado_ids = set(pop_map)
    malha_ids = {_norm_setor(_pick(f.get("properties") or {}, cols["setor_id"])) for f in features}
    sem_malha_join = len(agregado_ids - malha_ids)

    dest = Path(settings.ibge_setores_path) if settings.ibge_setores_path else Path("setores_preparados.geojson")
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(
        json.dumps({"type": "FeatureCollection", "features": out_feats}, ensure_ascii=False),
        encoding="utf-8",
    )
    return {
        "saida": str(dest),
        "setores": len(out_feats),
        "sem_agregado": sem_agregado,
        "sem_renda": sem_renda,
        "agregados_sem_malha": sem_malha_join,
    }
