"""Pool PostgreSQL + helpers de carga em lote. Sem URL = modo memória (testes)."""

from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterable, Iterator, Sequence

from convergeo_engine.config import Settings, get_settings


def _connect(url: str):
    import psycopg2
    from psycopg2.pool import ThreadedConnectionPool

    return ThreadedConnectionPool(minconn=1, maxconn=8, dsn=url)


_POOL = None


def get_pool(settings: Settings | None = None):
    global _POOL
    settings = settings or get_settings()
    if not settings.database_url:
        return None
    if _POOL is None:
        _POOL = _connect(settings.database_url)
    return _POOL


@contextmanager
def connection(settings: Settings | None = None) -> Iterator[Any]:
    pool = get_pool(settings)
    if pool is None:
        raise RuntimeError("DATABASE_URL vazio: use o repositório em memória nos testes.")
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


def execute_values(cur: Any, sql: str, rows: Sequence[Sequence[Any]]) -> None:
    from psycopg2.extras import execute_values as _ev

    if not rows:
        return
    _ev(cur, sql, rows, page_size=500)


def copy_rows(cur: Any, table: str, columns: Iterable[str], rows: Sequence[Sequence[Any]]) -> None:
    """COPY via StringIO (fallback se execute_values não couber)."""
    import io
    import csv

    buf = io.StringIO()
    writer = csv.writer(buf, delimiter="\t", lineterminator="\n")
    for row in rows:
        writer.writerow(["\\N" if v is None else v for v in row])
    buf.seek(0)
    cols = ",".join(columns)
    cur.copy_expert(f"COPY {table} ({cols}) FROM STDIN WITH (FORMAT csv, DELIMITER E'\\t', NULL '\\N')", buf)
