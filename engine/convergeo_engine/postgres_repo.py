"""PostgresRepository — schema ENGINE_SCHEMA; scores v1 legado em LEGACY_SCHEMA."""

from __future__ import annotations

from typing import Any
from uuid import uuid4

from convergeo_engine.config import Settings
from convergeo_engine.db import connection, execute_values


class PostgresRepository:
    demo = False

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.s = settings.engine_schema
        self.legacy = settings.legacy_schema

    def _q(self, table: str) -> str:
        return f"{self.s}.{table}"

    def replace_hexagonos(self, rows: list[dict]) -> None:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(f"TRUNCATE {self._q('hexagonos')} CASCADE")
            execute_values(
                cur,
                f"INSERT INTO {self._q('hexagonos')} (h3_index, municipio_ibge, pct_area_terrestre, lat, lng) VALUES %s",
                [
                    (r["h3_index"], r["municipio_ibge"], r["pct_area_terrestre"], r["lat"], r["lng"])
                    for r in rows
                ],
            )

    def list_hexagonos(self) -> list[dict]:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(
                f"SELECT h3_index, municipio_ibge, pct_area_terrestre, lat, lng FROM {self._q('hexagonos')}"
            )
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]

    def replace_demografico(self, rows: list[dict]) -> None:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(f"TRUNCATE {self._q('demografico')}")
            execute_values(
                cur,
                f"""INSERT INTO {self._q('demografico')}
                (h3_index, populacao, domicilios, densidade_hab_km2, renda_media, renda_fonte, renda_ano_base)
                VALUES %s""",
                [
                    (
                        r["h3_index"],
                        r.get("populacao"),
                        r.get("domicilios"),
                        r.get("densidade_hab_km2"),
                        r.get("renda_media"),
                        r.get("renda_fonte"),
                        r.get("renda_ano_base"),
                    )
                    for r in rows
                ],
            )

    def list_demografico(self) -> list[dict]:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(f"SELECT * FROM {self._q('demografico')}")
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]

    def replace_empresas(self, rows: list[dict]) -> None:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(f"TRUNCATE {self._q('empresas')}")
            execute_values(
                cur,
                f"""INSERT INTO {self._q('empresas')}
                (cnpj, cnae_principal, cnae_secundarias, data_inicio, cep, h3_index, geo_precisao, municipio_ibge, lat, lng)
                VALUES %s
                ON CONFLICT (cnpj) DO UPDATE SET h3_index = EXCLUDED.h3_index, geo_precisao = EXCLUDED.geo_precisao""",
                [
                    (
                        r["cnpj"],
                        r.get("cnae_principal"),
                        r.get("cnae_secundarias"),
                        r.get("data_inicio") or None,
                        r.get("cep"),
                        r.get("h3_index"),
                        r.get("geo_precisao") or "sem",
                        r.get("municipio_ibge"),
                        r.get("lat"),
                        r.get("lng"),
                    )
                    for r in rows
                ],
            )

    def list_empresas(self) -> list[dict]:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(f"SELECT * FROM {self._q('empresas')}")
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]

    def replace_osm(self, rows: list[dict]) -> None:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(f"TRUNCATE {self._q('osm_pois')}")
            execute_values(
                cur,
                f"INSERT INTO {self._q('osm_pois')} (osm_id, categoria, nome, lat, lng, h3_index) VALUES %s ON CONFLICT (osm_id) DO NOTHING",
                [(r["osm_id"], r["categoria"], r.get("nome"), r["lat"], r["lng"], r.get("h3_index")) for r in rows],
            )

    def list_osm(self) -> list[dict]:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(f"SELECT * FROM {self._q('osm_pois')}")
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]

    def upsert_score(self, row: dict) -> None:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(
                f"""INSERT INTO {self._q('scores')}
                (h3_index, segmento, score_estrutural, score_macroeconomico, score_comportamental, score_total)
                VALUES (%s,%s,%s,%s,%s,%s)
                ON CONFLICT (h3_index, segmento) DO UPDATE SET
                  score_estrutural = EXCLUDED.score_estrutural,
                  score_macroeconomico = EXCLUDED.score_macroeconomico,
                  score_comportamental = EXCLUDED.score_comportamental,
                  score_total = EXCLUDED.score_total""",
                (
                    row["h3_index"],
                    row["segmento"],
                    row.get("score_estrutural"),
                    row.get("score_macroeconomico"),
                    row.get("score_comportamental"),
                    row.get("score_total"),
                ),
            )

    def _scores_table(self) -> str:
        if self.settings.v1_source == "engine":
            return self._q("scores")
        return f"{self.legacy}.scores"

    def get_score(self, h3_index: str, segmento: str) -> dict | None:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(
                f"""SELECT h3_index, segmento, score_estrutural, score_macroeconomico,
                           score_comportamental, score_total
                    FROM {self._scores_table()}
                    WHERE h3_index = %s AND segmento = %s""",
                (h3_index, segmento),
            )
            row = cur.fetchone()
            if not row:
                return None
            cols = [d[0] for d in cur.description]
            return dict(zip(cols, row))

    def top_scores(self, segmento: str, limit: int) -> list[dict]:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(
                f"""SELECT h3_index, segmento, score_estrutural, score_macroeconomico,
                           score_comportamental, score_total
                    FROM {self._scores_table()}
                    WHERE segmento = %s AND score_total IS NOT NULL
                    ORDER BY score_total DESC LIMIT %s""",
                (segmento, limit),
            )
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]

    def replace_scores_imobiliario(self, rows: list[dict]) -> None:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(f"TRUNCATE {self._q('scores_imobiliario')}")
            execute_values(
                cur,
                f"""INSERT INTO {self._q('scores_imobiliario')}
                (h3_index, perfil, score_total, estrutural, macroeconomica, acessibilidade, mercado, cobertura)
                VALUES %s""",
                [
                    (
                        r["h3_index"],
                        r["perfil"],
                        r.get("score_total"),
                        r.get("estrutural"),
                        r.get("macroeconomica"),
                        r.get("acessibilidade"),
                        r.get("mercado"),
                        __import__("json").dumps(r.get("cobertura") or {}),
                    )
                    for r in rows
                ],
            )

    def list_scores_imobiliario(self, perfil: str | None = None) -> list[dict]:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            if perfil:
                cur.execute(f"SELECT * FROM {self._q('scores_imobiliario')} WHERE perfil = %s", (perfil,))
            else:
                cur.execute(f"SELECT * FROM {self._q('scores_imobiliario')}")
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]

    def get_score_imobiliario(self, h3_index: str, perfil: str) -> dict | None:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(
                f"SELECT * FROM {self._q('scores_imobiliario')} WHERE h3_index = %s AND perfil = %s",
                (h3_index, perfil),
            )
            row = cur.fetchone()
            if not row:
                return None
            cols = [d[0] for d in cur.description]
            return dict(zip(cols, row))

    def upsert_anunciante(self, rec: dict) -> dict:
        rec = {**rec, "id": rec.get("id") or str(uuid4())}
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(
                f"""INSERT INTO {self._q('anunciantes')}
                (id, tipo, nome, creci, documento, feed_url, feed_formato, api_key_hash, ativo, is_seed)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (id) DO UPDATE SET
                  nome = EXCLUDED.nome, feed_url = EXCLUDED.feed_url,
                  api_key_hash = COALESCE(EXCLUDED.api_key_hash, {self._q('anunciantes')}.api_key_hash),
                  atualizado_em = now()""",
                (
                    rec["id"],
                    rec.get("tipo") or "imobiliaria",
                    rec.get("nome") or "Anunciante",
                    rec.get("creci"),
                    rec.get("documento"),
                    rec.get("feed_url"),
                    rec.get("feed_formato"),
                    rec.get("api_key_hash"),
                    rec.get("ativo", True),
                    rec.get("is_seed", False),
                ),
            )
        return rec

    def get_anunciante(self, anunciante_id: str) -> dict | None:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(f"SELECT * FROM {self._q('anunciantes')} WHERE id = %s", (anunciante_id,))
            row = cur.fetchone()
            if not row:
                return None
            cols = [d[0] for d in cur.description]
            return dict(zip(cols, row))

    def list_anunciantes(self) -> list[dict]:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(f"SELECT * FROM {self._q('anunciantes')}")
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]

    def upsert_imoveis(self, anunciante_id: str, listings: list[dict]) -> dict:
        created = updated = events = 0
        with connection(self.settings) as conn:
            cur = conn.cursor()
            for raw in listings:
                cur.execute(
                    f"SELECT id, preco, status FROM {self._q('imoveis')} WHERE anunciante_id = %s AND id_externo = %s",
                    (anunciante_id, raw["id_externo"]),
                )
                prev = cur.fetchone()
                if prev is None:
                    iid = str(uuid4())
                    cur.execute(
                        f"""INSERT INTO {self._q('imoveis')}
                        (id, anunciante_id, id_externo, finalidade, tipo, preco, area_util, quartos,
                         endereco_bairro, endereco_cidade, cep, lat, lng, h3_index, geo_precisao,
                         ocultar_endereco, descricao, fotos, status)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s)""",
                        (
                            iid,
                            anunciante_id,
                            raw["id_externo"],
                            raw.get("finalidade") or "venda",
                            raw.get("tipo") or "apartamento",
                            raw.get("preco") or 0,
                            raw.get("area_util"),
                            raw.get("quartos"),
                            raw.get("endereco_bairro"),
                            raw.get("endereco_cidade"),
                            raw.get("cep"),
                            raw.get("lat"),
                            raw.get("lng"),
                            raw.get("h3_index"),
                            raw.get("geo_precisao"),
                            bool(raw.get("ocultar_endereco")),
                            raw.get("descricao"),
                            __import__("json").dumps(raw.get("fotos") or []),
                            raw.get("status") or "ativo",
                        ),
                    )
                    cur.execute(
                        f"INSERT INTO {self._q('imovel_eventos')} (imovel_id, evento, valor_novo) VALUES (%s,'criado',%s)",
                        (iid, str(raw.get("preco"))),
                    )
                    created += 1
                    events += 1
                else:
                    iid, old_preco, old_status = prev
                    if str(old_preco) != str(raw.get("preco")):
                        cur.execute(
                            f"INSERT INTO {self._q('imovel_eventos')} (imovel_id, evento, valor_anterior, valor_novo) VALUES (%s,'preco_alterado',%s,%s)",
                            (iid, str(old_preco), str(raw.get("preco"))),
                        )
                        events += 1
                    if old_status != raw.get("status"):
                        cur.execute(
                            f"INSERT INTO {self._q('imovel_eventos')} (imovel_id, evento, valor_anterior, valor_novo) VALUES (%s,'status_alterado',%s,%s)",
                            (iid, old_status, raw.get("status")),
                        )
                        events += 1
                    cur.execute(
                        f"""UPDATE {self._q('imoveis')} SET preco=%s, area_util=%s, status=%s, atualizado_em=now()
                            WHERE id=%s""",
                        (raw.get("preco") or 0, raw.get("area_util"), raw.get("status") or "ativo", iid),
                    )
                    updated += 1
        return {"created": created, "updated": updated, "events": events, "total": len(listings)}

    def list_imoveis(self, **filters: Any) -> list[dict]:
        clauses = ["1=1"]
        args: list[Any] = []
        if filters.get("status"):
            clauses.append("status = %s")
            args.append(filters["status"])
        if filters.get("finalidade"):
            clauses.append("finalidade = %s")
            args.append(filters["finalidade"])
        if filters.get("anunciante_id"):
            clauses.append("anunciante_id = %s")
            args.append(filters["anunciante_id"])
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(f"SELECT * FROM {self._q('imoveis')} WHERE {' AND '.join(clauses)}", args)
            cols = [d[0] for d in cur.description]
            out = []
            for row in cur.fetchall():
                rec = dict(zip(cols, row))
                if rec.get("fotos") and not isinstance(rec["fotos"], list):
                    rec["fotos"] = list(rec["fotos"])
                out.append(rec)
            return out

    def get_imovel(self, imovel_id: str) -> dict | None:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(f"SELECT * FROM {self._q('imoveis')} WHERE id = %s", (imovel_id,))
            row = cur.fetchone()
            if not row:
                return None
            cols = [d[0] for d in cur.description]
            return dict(zip(cols, row))

    def list_eventos(self, imovel_id: str) -> list[dict]:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(f"SELECT * FROM {self._q('imovel_eventos')} WHERE imovel_id = %s ORDER BY ocorrido_em", (imovel_id,))
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]

    def replace_precos_hex(self, rows: list[dict]) -> None:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(f"TRUNCATE {self._q('precos_hex')}")
            execute_values(
                cur,
                f"""INSERT INTO {self._q('precos_hex')}
                (h3_index, finalidade, tipologia, mediana_m2, p25_m2, p75_m2, n, estoque_ativo, nivel_fallback)
                VALUES %s""",
                [
                    (
                        r["h3_index"],
                        r["finalidade"],
                        r.get("tipologia") or r.get("tipo"),
                        r.get("mediana_m2"),
                        r.get("p25_m2"),
                        r.get("p75_m2"),
                        r.get("n") or 0,
                        r.get("estoque_ativo"),
                        r.get("nivel_fallback") or "municipio",
                    )
                    for r in rows
                ],
            )

    def list_precos_hex(self) -> list[dict]:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(f"SELECT * FROM {self._q('precos_hex')}")
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]

    def table_counts(self) -> dict[str, int]:
        out = {}
        with connection(self.settings) as conn:
            cur = conn.cursor()
            for table in ("hexagonos", "scores", "imoveis", "anunciantes", "empresas"):
                cur.execute(f"SELECT count(*) FROM {self._q(table)}")
                out[table] = int(cur.fetchone()[0])
        return out

    def get_geo_cep(self, cep: str) -> dict | None:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(f"SELECT lat, lng, status FROM {self._q('geo_cache_cep')} WHERE cep = %s", (cep,))
            row = cur.fetchone()
            if not row:
                return None
            return {"lat": row[0], "lng": row[1], "status": row[2]}

    def set_geo_cep(self, cep: str, lat: float | None, lng: float | None, status: str) -> None:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(
                f"""INSERT INTO {self._q('geo_cache_cep')} (cep, lat, lng, status)
                    VALUES (%s,%s,%s,%s)
                    ON CONFLICT (cep) DO UPDATE SET lat=EXCLUDED.lat, lng=EXCLUDED.lng, status=EXCLUDED.status, atualizado_em=now()""",
                (cep, lat, lng, status),
            )

    def get_geo_endereco(self, query: str) -> dict | None:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(
                f"SELECT lat, lng, status FROM {self._q('geo_cache_endereco')} WHERE query_norm = %s",
                (query,),
            )
            row = cur.fetchone()
            if not row:
                return None
            return {"lat": row[0], "lng": row[1], "status": row[2]}

    def set_geo_endereco(self, query: str, lat: float | None, lng: float | None, status: str) -> None:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(
                f"""INSERT INTO {self._q('geo_cache_endereco')} (query_norm, lat, lng, status)
                    VALUES (%s,%s,%s,%s)
                    ON CONFLICT (query_norm) DO UPDATE SET lat=EXCLUDED.lat, lng=EXCLUDED.lng, status=EXCLUDED.status, atualizado_em=now()""",
                (query, lat, lng, status),
            )

    def get_perfil(self, user_id: str) -> dict | None:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(f"SELECT * FROM {self._q('perfis_usuario')} WHERE user_id = %s", (user_id,))
            row = cur.fetchone()
            if not row:
                return None
            cols = [d[0] for d in cur.description]
            return dict(zip(cols, row))

    def upsert_perfil(self, rec: dict) -> dict:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(
                f"""INSERT INTO {self._q('perfis_usuario')}
                    (user_id, papel, nome, creci, anunciante_id, ativo)
                    VALUES (%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (user_id) DO UPDATE SET
                      papel = EXCLUDED.papel, nome = EXCLUDED.nome, creci = EXCLUDED.creci,
                      anunciante_id = EXCLUDED.anunciante_id, ativo = EXCLUDED.ativo""",
                (
                    rec["user_id"],
                    rec.get("papel") or "comprador",
                    rec.get("nome"),
                    rec.get("creci"),
                    rec.get("anunciante_id"),
                    rec.get("ativo", True),
                ),
            )
        return rec

    def list_membros(self, anunciante_id: str) -> list[dict]:
        with connection(self.settings) as conn:
            cur = conn.cursor()
            cur.execute(
                f"SELECT * FROM {self._q('anunciante_membros')} WHERE anunciante_id = %s",
                (anunciante_id,),
            )
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]

