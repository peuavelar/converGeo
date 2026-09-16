-- 001_base.sql — schema convergeo (idempotente)
CREATE SCHEMA IF NOT EXISTS convergeo;

CREATE TABLE IF NOT EXISTS convergeo.hexagonos (
  h3_index text PRIMARY KEY,
  municipio_ibge char(7) NOT NULL,
  pct_area_terrestre double precision NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  geom geometry(Polygon, 4326)
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

CREATE INDEX IF NOT EXISTS empresas_h3_idx ON convergeo.empresas (h3_index);
CREATE INDEX IF NOT EXISTS empresas_prec_idx ON convergeo.empresas (geo_precisao);
CREATE INDEX IF NOT EXISTS empresas_cnae_idx ON convergeo.empresas (cnae_principal);

CREATE TABLE IF NOT EXISTS convergeo.osm_pois (
  osm_id text PRIMARY KEY,
  categoria text NOT NULL,
  nome text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  h3_index text,
  geom geometry(Point, 4326)
);

CREATE INDEX IF NOT EXISTS osm_cat_idx ON convergeo.osm_pois (categoria);
CREATE INDEX IF NOT EXISTS osm_geom_gix ON convergeo.osm_pois USING GIST (geom);

CREATE TABLE IF NOT EXISTS convergeo.scores (
  h3_index text NOT NULL,
  segmento text NOT NULL,
  score_estrutural double precision,
  score_macroeconomico double precision,
  score_comportamental double precision,
  score_total double precision,
  PRIMARY KEY (h3_index, segmento)
);

CREATE INDEX IF NOT EXISTS scores_seg_total_idx ON convergeo.scores (segmento, score_total DESC);

CREATE TABLE IF NOT EXISTS convergeo.geo_cache_cep (
  cep char(8) PRIMARY KEY,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS convergeo.geo_cache_endereco (
  query_norm text PRIMARY KEY,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS convergeo.municipios_rf (
  codigo_tom text PRIMARY KEY,
  codigo_ibge char(7) NOT NULL,
  nome text,
  uf char(2)
);
