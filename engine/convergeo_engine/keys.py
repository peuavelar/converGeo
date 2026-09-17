"""HMAC-SHA256 de API keys. Comparação em tempo constante. ADR 0008."""

from __future__ import annotations

import hmac
import hashlib
import secrets

from convergeo_engine.config import get_settings


def hash_api_key(raw: str, pepper: str | None = None) -> str:
    settings = get_settings()
    secret = (pepper if pepper is not None else settings.api_key_pepper) or settings.engine_admin_key or "dev"
    return hmac.new(secret.encode("utf-8"), raw.encode("utf-8"), hashlib.sha256).hexdigest()


def keys_equal(left: str, right: str) -> bool:
    if not left or not right:
        return False
    return hmac.compare_digest(left, right)


def new_api_key() -> str:
    return secrets.token_urlsafe(32)
