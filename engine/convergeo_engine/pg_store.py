"""Persistência e leitura do schema convergeo (modelo Thiago / API v1)."""

from __future__ import annotations

from convergeo_engine.db import connection
from convergeo_engine.geo import hex_polygon
from convergeo_engine.store import MemoryStore


def persist_store(store: MemoryStore) -> dict[str, int]:
    """Grava hexágonos, POIs OSM e scores v1 no Postgres + PostGIS."""
    with connection() as conn:
        cur = conn.cursor()
        n_hex = 0
        for r in store.hexagonos:
            h3_index = r["h3_index"]
            try:
                wkt = hex_polygon(h3_index).wkt
            except Exception:
                wkt = None
            cur.execute(
                """
                INSERT INTO convergeo.hexagonos
                  (h3_index, municipio_ibge, pct_area_terrestre, lat, lng, geom,
                   h3_resolucao, fonte)
                VALUES (
                  %s, %s, %s, %s, %s,
                  CASE WHEN %s IS NULL THEN NULL ELSE ST_GeomFromText(%s, 4326) END,
                  %s, %s
                )
                ON CONFLICT (h3_index) DO UPDATE SET
                  municipio_ibge = EXCLUDED.municipio_ibge,
                  pct_area_terrestre = EXCLUDED.pct_area_terrestre,
                  lat = EXCLUDED.lat,
                  lng = EXCLUDED.lng,
                  geom = COALESCE(EXCLUDED.geom, convergeo.hexagonos.geom),
                  h3_resolucao = EXCLUDED.h3_resolucao,
                  fonte = EXCLUDED.fonte
                """,
                (
                    h3_index,
                    r.get("municipio_ibge") or "2927408",
                    float(r.get("pct_area_terrestre") or 1.0),
                    float(r["lat"]),
                    float(r["lng"]),
                    wkt,
                    wkt,
                    int(r.get("h3_resolucao") or 8),
                    r.get("fonte") or "bbox_salvador",
                ),
            )
            n_hex += 1

        n_osm = 0
        for p in store.osm_pois:
            cur.execute(
                """
                INSERT INTO convergeo.osm_pois
                  (osm_id, categoria, nome, lat, lng, h3_index, geom)
                VALUES (
                  %s, %s, %s, %s, %s, %s,
                  ST_SetSRID(ST_MakePoint(%s, %s), 4326)
                )
                ON CONFLICT (osm_id) DO UPDATE SET
                  categoria = EXCLUDED.categoria,
                  nome = EXCLUDED.nome,
                  lat = EXCLUDED.lat,
                  lng = EXCLUDED.lng,
                  h3_index = EXCLUDED.h3_index,
                  geom = EXCLUDED.geom
                """,
                (
                    p["osm_id"],
                    p.get("categoria") or "outro",
                    p.get("nome"),
                    float(p["lat"]),
                    float(p["lng"]),
                    p.get("h3_index"),
                    float(p["lng"]),
                    float(p["lat"]),
                ),
            )
            n_osm += 1

        n_sc = 0
        for s in store.scores:
            cur.execute(
                """
                INSERT INTO convergeo.scores
                  (h3_index, segmento, score_estrutural, score_macroeconomico,
                   score_comportamental, score_total, fonte, calculado_em)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (h3_index, segmento) DO UPDATE SET
                  score_estrutural = EXCLUDED.score_estrutural,
                  score_macroeconomico = EXCLUDED.score_macroeconomico,
                  score_comportamental = EXCLUDED.score_comportamental,
                  score_total = EXCLUDED.score_total,
                  fonte = EXCLUDED.fonte,
                  calculado_em = NOW()
                """,
                (
                    s["h3_index"],
                    s["segmento"],
                    s.get("score_estrutural"),
                    s.get("score_macroeconomico"),
                    s.get("score_comportamental"),
                    s.get("score_total"),
                    s.get("fonte") or "osm_comportamental",
                ),
            )
            n_sc += 1
    return {"hexagonos": n_hex, "osm_pois": n_osm, "scores": n_sc}


class PostgresStore:
    """Leitura v1 a partir do schema convergeo (mesmo SELECT do Thiago)."""

    def __init__(self) -> None:
        self.hexagonos: list[dict] = []
        self.demografico: list[dict] = []
        self.empresas: list[dict] = []
        self.osm_pois: list[dict] = []
        self.scores: list[dict] = []
        self.scores_imobiliario: list[dict] = []
        self.anunciantes: list[dict] = []
        self.imoveis: list[dict] = []
        self.imovel_eventos: list[dict] = []
        self.precos_hex: list[dict] = []

    def get_score(self, h3_index: str, segmento: str) -> dict | None:
        with connection() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT h3_index, segmento, score_estrutural, score_macroeconomico,
                       score_comportamental, score_total
                FROM convergeo.scores
                WHERE h3_index = %s AND segmento = %s
                """,
                (h3_index, segmento),
            )
            row = cur.fetchone()
        if not row:
            return None
        return {
            "h3_index": row[0],
            "segmento": row[1],
            "score_estrutural": row[2],
            "score_macroeconomico": row[3],
            "score_comportamental": row[4],
            "score_total": row[5],
        }

    def top_scores(self, segmento: str, limit: int) -> list[dict]:
        with connection() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT h3_index, segmento, score_estrutural, score_macroeconomico,
                       score_comportamental, score_total
                FROM convergeo.scores
                WHERE segmento = %s AND score_total IS NOT NULL
                ORDER BY score_total DESC
                LIMIT %s
                """,
                (segmento, max(1, min(limit, 500))),
            )
            rows = cur.fetchall()
        return [
            {
                "h3_index": r[0],
                "segmento": r[1],
                "score_estrutural": r[2],
                "score_macroeconomico": r[3],
                "score_comportamental": r[4],
                "score_total": r[5],
            }
            for r in rows
        ]

    def replace_hexagonos(self, rows: list[dict]) -> None:
        tmp = MemoryStore()
        tmp.hexagonos = list(rows)
        persist_store(tmp)

    def replace_osm(self, rows: list[dict]) -> None:
        tmp = MemoryStore()
        tmp.osm_pois = list(rows)
        persist_store(tmp)

    def replace_demografico(self, rows: list[dict]) -> None:
        self.demografico = list(rows)

    def replace_empresas(self, rows: list[dict]) -> None:
        self.empresas = list(rows)

    def upsert_score(self, row: dict) -> None:
        tmp = MemoryStore()
        tmp.scores = [row]
        persist_store(tmp)

    def counts(self) -> dict[str, int]:
        with connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM convergeo.hexagonos")
            h = int(cur.fetchone()[0])
            cur.execute("SELECT COUNT(*) FROM convergeo.scores")
            s = int(cur.fetchone()[0])
            cur.execute("SELECT COUNT(*) FROM convergeo.osm_pois")
            o = int(cur.fetchone()[0])
        return {"hexagonos": h, "scores": s, "osm_pois": o}
