from convergeo_engine.dsn import describe_dsn, normalize_database_url, warn_transaction_pooler


def test_normalize_adds_ssl_for_supabase_pooler():
    raw = "postgres://postgres.abc:s3cret@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
    out = normalize_database_url(raw)
    assert out.startswith("postgresql://")
    assert "sslmode=require" in out
    assert "s3cret" in out  # senha preservada
    info = describe_dsn(raw)
    assert info["mode"] == "session"
    assert info["host"] == "aws-0-sa-east-1.pooler.supabase.com"
    assert warn_transaction_pooler(raw) is None


def test_transaction_pooler_warned():
    raw = "postgresql://postgres.abc:x@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
    assert warn_transaction_pooler(raw)
    assert describe_dsn(raw)["mode"] == "transaction"
