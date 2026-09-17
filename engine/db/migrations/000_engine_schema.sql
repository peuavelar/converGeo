-- 000_engine_schema.sql — schema novo isolado do legado convergeo
CREATE SCHEMA IF NOT EXISTS convergeo_engine;

CREATE TABLE IF NOT EXISTS convergeo_engine.schema_migrations (
  versao text PRIMARY KEY,
  aplicada_em timestamptz NOT NULL DEFAULT now(),
  checksum text NOT NULL
);
