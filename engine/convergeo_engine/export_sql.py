"""Gera SQL para o Editor do Supabase (sem DATABASE_URL neste agente)."""

from __future__ import annotations

from pathlib import Path

from convergeo_engine.geo import hex_polygon
from convergeo_engine.store import MemoryStore


def _sql_str(value: object) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value).replace("'", "''")
    return f"'{text}'"


def export_hex_sql(store: MemoryStore) -> str:
    rows = []
    for r in store.hexagonos:
        try:
            wkt = hex_polygon(r["h3_index"]).wkt
        except Exception:
            wkt = None
        geom = "NULL" if wkt is None else f"ST_GeomFromText({_sql_str(wkt)}, 4326)"
        rows.append(
            "("
            + ",".join(
                [
                    _sql_str(r["h3_index"]),
                    _sql_str(r.get("municipio_ibge") or "2927408"),
                    _sql_str(float(r.get("pct_area_terrestre") or 1)),
                    _sql_str(float(r["lat"])),
                    _sql_str(float(r["lng"])),
                    geom,
                    _sql_str(int(r.get("h3_resolucao") or 8)),
                    _sql_str(r.get("fonte") or "bbox_salvador"),
                ]
            )
            + ")"
        )
    if not rows:
        return "-- nenhum hexágono\n"
    parts = [
        "-- Grade H3 Salvador (bbox). Idempotente.",
        "INSERT INTO convergeo.hexagonos",
        "  (h3_index, municipio_ibge, pct_area_terrestre, lat, lng, geom, h3_resolucao, fonte)",
        "VALUES",
        ",\n".join(rows),
        "ON CONFLICT (h3_index) DO UPDATE SET",
        "  lat = EXCLUDED.lat, lng = EXCLUDED.lng, geom = EXCLUDED.geom,",
        "  fonte = EXCLUDED.fonte;",
        "",
    ]
    return "\n".join(parts)


def export_scores_sql(store: MemoryStore) -> str:
    rows = []
    for s in store.scores:
        rows.append(
            "("
            + ",".join(
                [
                    _sql_str(s["h3_index"]),
                    _sql_str(s["segmento"]),
                    _sql_str(s.get("score_estrutural")),
                    _sql_str(s.get("score_macroeconomico")),
                    _sql_str(s.get("score_comportamental")),
                    _sql_str(s.get("score_total")),
                    _sql_str(s.get("fonte") or "osm_comportamental"),
                ]
            )
            + ")"
        )
    if not rows:
        return "-- nenhum score\n"
    parts = [
        "-- Scores v1 (17 segmentos). Camadas IBGE/RF ainda NULL.",
        "INSERT INTO convergeo.scores",
        "  (h3_index, segmento, score_estrutural, score_macroeconomico,",
        "   score_comportamental, score_total, fonte)",
        "VALUES",
        ",\n".join(rows),
        "ON CONFLICT (h3_index, segmento) DO UPDATE SET",
        "  score_comportamental = EXCLUDED.score_comportamental,",
        "  score_total = EXCLUDED.score_total,",
        "  fonte = EXCLUDED.fonte,",
        "  calculado_em = NOW();",
        "",
    ]
    return "\n".join(parts)


def write_export(store: MemoryStore, directory: Path) -> dict[str, int]:
    directory.mkdir(parents=True, exist_ok=True)
    hex_path = directory / "seed_hexagonos.sql"
    sc_path = directory / "seed_scores.sql"
    hex_sql = export_hex_sql(store)
    sc_sql = export_scores_sql(store)
    hex_path.write_text(hex_sql, encoding="utf-8")
    sc_path.write_text(sc_sql, encoding="utf-8")
    return {
        "hexagonos": len(store.hexagonos),
        "scores": len(store.scores),
        "hex_bytes": hex_path.stat().st_size,
        "scores_bytes": sc_path.stat().st_size,
    }
