"""Repositório em memória (testes / MVP sem Postgres) + interface de persistência."""

from __future__ import annotations

from dataclasses import dataclass, field
from threading import Lock
from typing import Any


@dataclass
class MemoryStore:
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
    _lock: Lock = field(default_factory=Lock)

    def replace_hexagonos(self, rows: list[dict]) -> None:
        with self._lock:
            self.hexagonos = list(rows)

    def replace_demografico(self, rows: list[dict]) -> None:
        with self._lock:
            self.demografico = list(rows)

    def replace_empresas(self, rows: list[dict]) -> None:
        with self._lock:
            self.empresas = list(rows)

    def replace_osm(self, rows: list[dict]) -> None:
        with self._lock:
            self.osm_pois = list(rows)

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


_STORE: MemoryStore | None = None


def get_store() -> MemoryStore:
    global _STORE
    if _STORE is None:
        _STORE = MemoryStore()
    return _STORE


def reset_store() -> MemoryStore:
    global _STORE
    _STORE = MemoryStore()
    return _STORE
