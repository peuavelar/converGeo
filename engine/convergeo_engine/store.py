"""Repositório: Protocol + MemoryStore (testes/demo) + seleção Postgres."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from threading import Lock
from typing import Any, Protocol
from uuid import uuid4


class Repository(Protocol):
    demo: bool

    def replace_hexagonos(self, rows: list[dict]) -> None: ...
    def list_hexagonos(self) -> list[dict]: ...
    def replace_demografico(self, rows: list[dict]) -> None: ...
    def list_demografico(self) -> list[dict]: ...
    def replace_empresas(self, rows: list[dict]) -> None: ...
    def list_empresas(self) -> list[dict]: ...
    def replace_osm(self, rows: list[dict]) -> None: ...
    def list_osm(self) -> list[dict]: ...
    def upsert_score(self, row: dict) -> None: ...
    def get_score(self, h3_index: str, segmento: str) -> dict | None: ...
    def top_scores(self, segmento: str, limit: int) -> list[dict]: ...
    def replace_scores_imobiliario(self, rows: list[dict]) -> None: ...
    def list_scores_imobiliario(self, perfil: str | None = None) -> list[dict]: ...
    def get_score_imobiliario(self, h3_index: str, perfil: str) -> dict | None: ...
    def upsert_anunciante(self, rec: dict) -> dict: ...
    def get_anunciante(self, anunciante_id: str) -> dict | None: ...
    def list_anunciantes(self) -> list[dict]: ...
    def upsert_imoveis(self, anunciante_id: str, listings: list[dict]) -> dict: ...
    def list_imoveis(self, **filters: Any) -> list[dict]: ...
    def get_imovel(self, imovel_id: str) -> dict | None: ...
    def list_eventos(self, imovel_id: str) -> list[dict]: ...
    def replace_precos_hex(self, rows: list[dict]) -> None: ...
    def list_precos_hex(self) -> list[dict]: ...
    def table_counts(self) -> dict[str, int]: ...
    def get_geo_cep(self, cep: str) -> dict | None: ...
    def set_geo_cep(self, cep: str, lat: float | None, lng: float | None, status: str) -> None: ...
    def get_geo_endereco(self, query: str) -> dict | None: ...
    def set_geo_endereco(self, query: str, lat: float | None, lng: float | None, status: str) -> None: ...
    def get_perfil(self, user_id: str) -> dict | None: ...
    def upsert_perfil(self, rec: dict) -> dict: ...
    def list_membros(self, anunciante_id: str) -> list[dict]: ...


@dataclass
class MemoryStore:
    demo: bool = False
    hexagonos: list[dict] = field(default_factory=list)
    demografico: list[dict] = field(default_factory=list)
    empresas: list[dict] = field(default_factory=list)
    osm_pois: list[dict] = field(default_factory=list)
    scores: list[dict] = field(default_factory=list)
    scores_imobiliario: list[dict] = field(default_factory=list)
    anunciantes: list[dict] = field(default_factory=list)
    imoveis: list[dict] = field(default_factory=list)
    imovel_eventos: list[dict] = field(default_factory=list)
    precos_hex: list[dict] = field(default_factory=list)
    geo_cep: dict[str, dict] = field(default_factory=dict)
    geo_endereco: dict[str, dict] = field(default_factory=dict)
    perfis: list[dict] = field(default_factory=list)
    membros: list[dict] = field(default_factory=list)
    _lock: Lock = field(default_factory=Lock)

    def replace_hexagonos(self, rows: list[dict]) -> None:
        with self._lock:
            self.hexagonos = list(rows)

    def list_hexagonos(self) -> list[dict]:
        return list(self.hexagonos)

    def replace_demografico(self, rows: list[dict]) -> None:
        with self._lock:
            self.demografico = list(rows)

    def list_demografico(self) -> list[dict]:
        return list(self.demografico)

    def replace_empresas(self, rows: list[dict]) -> None:
        with self._lock:
            self.empresas = list(rows)

    def list_empresas(self) -> list[dict]:
        return list(self.empresas)

    def replace_osm(self, rows: list[dict]) -> None:
        with self._lock:
            self.osm_pois = list(rows)

    def list_osm(self) -> list[dict]:
        return list(self.osm_pois)

    def upsert_score(self, row: dict) -> None:
        with self._lock:
            self.scores = [
                s
                for s in self.scores
                if not (s["h3_index"] == row["h3_index"] and s["segmento"] == row["segmento"])
            ]
            self.scores.append(row)

    def get_score(self, h3_index: str, segmento: str) -> dict | None:
        for s in self.scores:
            if s["h3_index"] == h3_index and s["segmento"] == segmento:
                return s
        return None

    def top_scores(self, segmento: str, limit: int) -> list[dict]:
        rows = [s for s in self.scores if s.get("segmento") == segmento and s.get("score_total") is not None]
        rows.sort(key=lambda s: s["score_total"], reverse=True)
        return rows[:limit]

    def replace_scores_imobiliario(self, rows: list[dict]) -> None:
        with self._lock:
            self.scores_imobiliario = list(rows)

    def list_scores_imobiliario(self, perfil: str | None = None) -> list[dict]:
        rows = self.scores_imobiliario
        if perfil:
            rows = [s for s in rows if s.get("perfil") == perfil]
        return list(rows)

    def get_score_imobiliario(self, h3_index: str, perfil: str) -> dict | None:
        return next(
            (s for s in self.scores_imobiliario if s["h3_index"] == h3_index and s["perfil"] == perfil),
            None,
        )

    def upsert_anunciante(self, rec: dict) -> dict:
        with self._lock:
            rec = {**rec, "id": rec.get("id") or str(uuid4())}
            self.anunciantes = [a for a in self.anunciantes if a["id"] != rec["id"]]
            self.anunciantes.append(rec)
            return rec

    def get_anunciante(self, anunciante_id: str) -> dict | None:
        return next((a for a in self.anunciantes if a["id"] == anunciante_id), None)

    def list_anunciantes(self) -> list[dict]:
        return list(self.anunciantes)

    def upsert_imoveis(self, anunciante_id: str, listings: list[dict]) -> dict:
        created = updated = events = 0
        now = datetime.now(timezone.utc).isoformat()
        with self._lock:
            existing = {
                (i["anunciante_id"], i["id_externo"]): i
                for i in self.imoveis
                if i["anunciante_id"] == anunciante_id
            }
            for raw in listings:
                key = (anunciante_id, raw["id_externo"])
                prev = existing.get(key)
                if prev is None:
                    rec = {**raw, "id": str(uuid4()), "anunciante_id": anunciante_id, "atualizado_em": now}
                    self.imoveis.append(rec)
                    self.imovel_eventos.append(
                        {
                            "imovel_id": rec["id"],
                            "evento": "criado",
                            "valor_anterior": None,
                            "valor_novo": str(rec.get("preco")),
                            "ocorrido_em": now,
                        }
                    )
                    created += 1
                    events += 1
                    existing[key] = rec
                else:
                    if prev.get("preco") != raw.get("preco"):
                        self.imovel_eventos.append(
                            {
                                "imovel_id": prev["id"],
                                "evento": "preco_alterado",
                                "valor_anterior": str(prev.get("preco")),
                                "valor_novo": str(raw.get("preco")),
                                "ocorrido_em": now,
                            }
                        )
                        events += 1
                    if prev.get("status") != raw.get("status"):
                        self.imovel_eventos.append(
                            {
                                "imovel_id": prev["id"],
                                "evento": "status_alterado",
                                "valor_anterior": str(prev.get("status")),
                                "valor_novo": str(raw.get("status")),
                                "ocorrido_em": now,
                            }
                        )
                        events += 1
                    prev.update({**raw, "id": prev["id"], "anunciante_id": anunciante_id, "atualizado_em": now})
                    updated += 1
        return {"created": created, "updated": updated, "events": events, "total": len(listings)}

    def list_imoveis(self, **filters: Any) -> list[dict]:
        rows = list(self.imoveis)
        if filters.get("status"):
            rows = [i for i in rows if i.get("status") == filters["status"]]
        if filters.get("finalidade"):
            rows = [i for i in rows if i.get("finalidade") == filters["finalidade"]]
        if filters.get("anunciante_id"):
            rows = [i for i in rows if i.get("anunciante_id") == filters["anunciante_id"]]
        return rows

    def get_imovel(self, imovel_id: str) -> dict | None:
        return next((i for i in self.imoveis if i["id"] == imovel_id), None)

    def list_eventos(self, imovel_id: str) -> list[dict]:
        return [e for e in self.imovel_eventos if e["imovel_id"] == imovel_id]

    def replace_precos_hex(self, rows: list[dict]) -> None:
        with self._lock:
            self.precos_hex = list(rows)

    def list_precos_hex(self) -> list[dict]:
        return list(self.precos_hex)

    def table_counts(self) -> dict[str, int]:
        return {
            "hexagonos": len(self.hexagonos),
            "scores": len(self.scores),
            "imoveis": len(self.imoveis),
            "anunciantes": len(self.anunciantes),
            "empresas": len(self.empresas),
        }

    def get_geo_cep(self, cep: str) -> dict | None:
        return self.geo_cep.get(cep)

    def set_geo_cep(self, cep: str, lat: float | None, lng: float | None, status: str) -> None:
        self.geo_cep[cep] = {"lat": lat, "lng": lng, "status": status}

    def get_geo_endereco(self, query: str) -> dict | None:
        return self.geo_endereco.get(query)

    def set_geo_endereco(self, query: str, lat: float | None, lng: float | None, status: str) -> None:
        self.geo_endereco[query] = {"lat": lat, "lng": lng, "status": status}

    def get_perfil(self, user_id: str) -> dict | None:
        return next((p for p in getattr(self, "perfis", []) if p["user_id"] == user_id), None)

    def upsert_perfil(self, rec: dict) -> dict:
        with self._lock:
            self.perfis = [p for p in getattr(self, "perfis", []) if p["user_id"] != rec["user_id"]]
            self.perfis.append(rec)
            return rec

    def list_membros(self, anunciante_id: str) -> list[dict]:
        return [m for m in getattr(self, "membros", []) if m["anunciante_id"] == anunciante_id]


_STORE: MemoryStore | None = None
_REPO = None


def get_store() -> MemoryStore:
    global _STORE
    if _STORE is None:
        _STORE = MemoryStore()
    return _STORE


def reset_store() -> MemoryStore:
    global _STORE, _REPO
    _STORE = MemoryStore()
    _REPO = None
    return _STORE


def get_repository() -> Repository:
    global _REPO
    from convergeo_engine.config import get_settings

    settings = get_settings()
    if settings.database_url:
        if _REPO is None:
            from convergeo_engine.postgres_repo import PostgresRepository

            _REPO = PostgresRepository(settings)
        return _REPO
    return get_store()
