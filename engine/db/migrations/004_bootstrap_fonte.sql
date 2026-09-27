-- 004 — PostGIS + metadados do bootstrap (bbox Salvador, fonte da camada)
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE convergeo.hexagonos
  ADD COLUMN IF NOT EXISTS h3_resolucao integer DEFAULT 8,
  ADD COLUMN IF NOT EXISTS fonte text DEFAULT 'bbox_salvador';

ALTER TABLE convergeo.scores
  ADD COLUMN IF NOT EXISTS fonte text,
  ADD COLUMN IF NOT EXISTS calculado_em timestamptz DEFAULT now();
