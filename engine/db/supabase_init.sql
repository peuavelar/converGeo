-- Colar no SQL Editor do projeto jhbzotgjpfxfajvjgnuu (Run).
-- Ordem: PostGIS → schema → colunas extra.
-- Depois: engine/db/seed/seed_hexagonos.sql e seed_scores.sql

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE SCHEMA IF NOT EXISTS convergeo;

CREATE TABLE IF NOT EXISTS convergeo.hexagonos (
  h3_index text PRIMARY KEY,
  municipio_ibge char(7) NOT NULL,
  pct_area_terrestre double precision NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  geom geometry(Polygon, 4326),
  h3_resolucao integer DEFAULT 8,
  fonte text DEFAULT 'bbox_salvador'
);

CREATE INDEX IF NOT EXISTS hexagonos_mun_idx ON convergeo.hexagonos (municipio_ibge);
CREATE INDEX IF NOT EXISTS hexagonos_geom_gix ON convergeo.hexagonos USING GIST (geom);

CREATE TABLE IF NOT EXISTS convergeo.demografico (
  h3_index text PRIMARY KEY REFERENCES convergeo.hexagonos (h3_index),
  populacao double precision,
  domicilios double precision,
  densidade_hab_km2 double precision,
  renda_media double precision,
  renda_fonte text,
  renda_ano_base integer
);

CREATE TABLE IF NOT EXISTS convergeo.empresas (
  cnpj text PRIMARY KEY,
  cnae_principal text,
  cnae_secundarias text,
  data_inicio date,
  cep text,
  h3_index text REFERENCES convergeo.hexagonos (h3_index),
  geo_precisao text NOT NULL CHECK (geo_precisao IN ('cep', 'endereco', 'bairro', 'sem')),
  municipio_ibge char(7),
  lat double precision,
  lng double precision
);

CREATE TABLE IF NOT EXISTS convergeo.osm_pois (
  osm_id text PRIMARY KEY,
  categoria text NOT NULL,
  nome text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  h3_index text,
  geom geometry(Point, 4326)
);

CREATE TABLE IF NOT EXISTS convergeo.scores (
  h3_index text NOT NULL,
  segmento text NOT NULL,
  score_estrutural double precision,
  score_macroeconomico double precision,
  score_comportamental double precision,
  score_total double precision,
  fonte text,
  calculado_em timestamptz DEFAULT now(),
  PRIMARY KEY (h3_index, segmento)
);

CREATE INDEX IF NOT EXISTS scores_seg_total_idx ON convergeo.scores (segmento, score_total DESC);
