"""Auth de produção, rate limit e limites de upload."""

from __future__ import annotations

import time
from collections import defaultdict

from fastapi import Header, HTTPException, Request

from convergeo_engine.config import get_settings
from convergeo_engine.keys import hash_api_key, keys_equal
from convergeo_engine.store import get_repository


def assert_production_secrets() -> None:
    settings = get_settings()
    if not settings.is_production:
        return
    key = settings.engine_admin_key or ""
    if len(key) < settings.engine_admin_key_min_len:
        raise RuntimeError(
            f"ENGINE_ADMIN_KEY obrigatória em produção (mín. {settings.engine_admin_key_min_len} caracteres)."
        )


def require_admin(x_api_key: str | None) -> None:
    settings = get_settings()
    if not settings.engine_admin_key:
        if settings.is_production:
            raise HTTPException(503, "admin key não configurada")
        raise HTTPException(401, "API key inválida")
    if not x_api_key or not keys_equal(hash_api_key(x_api_key), hash_api_key(settings.engine_admin_key)):
        raise HTTPException(401, "API key inválida")


def require_anunciante(anunciante_id: str, x_api_key: str | None) -> None:
    if not x_api_key:
        raise HTTPException(401, "API key inválida")
    repo = get_repository()
    an = repo.get_anunciante(anunciante_id)
    if not an or not an.get("api_key_hash"):
        raise HTTPException(401, "API key inválida")
    if not keys_equal(an["api_key_hash"], hash_api_key(x_api_key)):
        raise HTTPException(401, "API key inválida")
    if not an.get("ativo", True):
        raise HTTPException(403, "anunciante inativo")


_HITS: dict[str, list[float]] = defaultdict(list)


def rate_limit(request: Request) -> None:
    settings = get_settings()
    limit = settings.rate_limit_per_min
    if limit <= 0:
        return
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = [t for t in _HITS[ip] if now - t < 60]
    if len(window) >= limit:
        raise HTTPException(429, "rate limit")
    window.append(now)
    _HITS[ip] = window
