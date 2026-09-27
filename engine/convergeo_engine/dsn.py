"""Normaliza DATABASE_URL para Supabase / Postgres (sem logar senha)."""

from __future__ import annotations

from urllib.parse import parse_qs, urlencode, urlparse, urlunparse


def normalize_database_url(raw: str) -> str:
    url = (raw or "").strip()
    if not url:
        return ""
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    qs = parse_qs(parsed.query, keep_blank_values=True)
    supabase = "supabase.co" in host or "supabase.com" in host
    if supabase and "sslmode" not in qs:
        qs["sslmode"] = ["require"]
    query = urlencode({k: v[0] if len(v) == 1 else v for k, v in qs.items()}, doseq=True)
    scheme = parsed.scheme or "postgresql"
    if scheme == "postgres":
        scheme = "postgresql"
    return urlunparse(parsed._replace(scheme=scheme, query=query))


def describe_dsn(raw: str) -> dict[str, str | int | None]:
    """Metadados sem senha — para ping e health."""
    parsed = urlparse(normalize_database_url(raw) or raw)
    port = parsed.port
    host = parsed.hostname
    mode = "direct"
    if host and "pooler.supabase.com" in host:
        mode = "session" if port == 5432 else "transaction" if port == 6543 else "pooler"
    elif host and host.startswith("db.") and host.endswith(".supabase.co"):
        mode = "direct"
    return {
        "host": host,
        "port": port,
        "database": (parsed.path or "/").lstrip("/") or "postgres",
        "user": parsed.username,
        "mode": mode,
    }


def warn_transaction_pooler(raw: str) -> str | None:
    info = describe_dsn(raw)
    if info["mode"] == "transaction":
        return (
            "URI em Transaction pooler (porta 6543). "
            "Migrate/bootstrap precisam de Session (5432) ou Direct."
        )
    return None
