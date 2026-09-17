"""JWT Supabase (JWKS). Papel sempre vem do banco, nunca do cliente."""

from __future__ import annotations

from functools import lru_cache

from fastapi import Header, HTTPException

from convergeo_engine.config import get_settings
from convergeo_engine.store import get_repository

PAPEIS_ESCRITA = {
    "admin",
    "imobiliaria",
    "corretor",
    "proprietario",
    "incorporadora",
}


@lru_cache
def _jwk_client(url: str):
    from jwt import PyJWKClient

    return PyJWKClient(url)


def decode_supabase_jwt(token: str) -> dict:
    settings = get_settings()
    jwks = settings.supabase_jwks_url
    if not jwks and settings.supabase_url:
        jwks = settings.supabase_url.rstrip("/") + "/auth/v1/.well-known/jwks.json"
    if not jwks:
        raise HTTPException(503, "auth não configurada")
    try:
        import jwt

        client = _jwk_client(jwks)
        key = client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            key.key,
            algorithms=["RS256", "ES256"],
            audience=settings.supabase_jwt_aud,
            options={"require": ["exp", "sub"]},
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(401, "JWT inválido")


def require_jwt(authorization: str | None) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "JWT inválido")
    payload = decode_supabase_jwt(authorization.split(" ", 1)[1].strip())
    user_id = str(payload.get("sub") or "")
    if not user_id:
        raise HTTPException(401, "JWT inválido")
    return {"user_id": user_id, "claims": payload}


def require_user(authorization: str | None) -> dict:
    ctx = require_jwt(authorization)
    perfil = get_repository().get_perfil(ctx["user_id"])
    if not perfil or not perfil.get("ativo", True):
        raise HTTPException(403, "perfil inativo ou inexistente")
    return {**ctx, "perfil": perfil}


def require_papel(authorization: str | None, allowed: set[str]) -> dict:
    ctx = require_user(authorization)
    papel = ctx["perfil"].get("papel")
    if papel not in allowed:
        raise HTTPException(403, "sem permissão")
    return ctx


def assert_posse_anunciante(ctx: dict, anunciante_id: str) -> None:
    perfil = ctx["perfil"]
    if perfil.get("papel") == "admin":
        return
    if str(perfil.get("anunciante_id") or "") != str(anunciante_id):
        raise HTTPException(403, "anúncio de outro anunciante")
