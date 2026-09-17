-- 001_base.sql — tabelas do engine (NÃO usa o schema legado convergeo)
CREATE TABLE IF NOT EXISTS convergeo_engine.hexagonos (
  h3_index text PRIMARY KEY,
  municipio_ibge char(7) NOT NULL,
  pct_area_terrestre double precision NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  geom geometry(Polygon, 4326)
);

CREATE INDEX IF NOT EXISTS eng_hexagonos_mun_idx ON convergeo_engine.hexagonos (municipio_ibge);
CREATE INDEX IF NOT EXISTS eng_hexagonos_geom_gix ON convergeo_engine.hexagonos USING GIST (geom);

CREATE TABLE IF NOT EXISTS convergeo_engine.demografico (
  h3_index text PRIMARY KEY REFERENCES convergeo_engine.hexagonos (h3_index),
  populacao double precision,
  domicilios double precision,
  densidade_hab_km2 double precision,
  renda_media double precision,
  renda_fonte text,
  renda_ano_base integer
);

CREATE TABLE IF NOT EXISTS convergeo_engine.empresas (
  cnpj text PRIMARY KEY,
  cnae_principal text,
  cnae_secundarias text,
  data_inicio date,
  cep text,
  h3_index text,
  geo_precisao text NOT NULL CHECK (geo_precisao IN ('cep', 'endereco', 'bairro', 'sem')),
  municipio_ibge char(7),
  lat double precision,
  lng double precision
);

CREATE INDEX IF NOT EXISTS eng_empresas_h3_idx ON convergeo_engine.empresas (h3_index);
CREATE INDEX IF NOT EXISTS eng_empresas_prec_idx ON convergeo_engine.empresas (geo_precisao);
CREATE INDEX IF NOT EXISTS eng_empresas_cnae_idx ON convergeo_engine.empresas (cnae_principal);

CREATE TABLE IF NOT EXISTS convergeo_engine.osm_pois (
  osm_id text PRIMARY KEY,
  categoria text NOT NULL,
  nome text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  h3_index text,
  geom geometry(Point, 4326)
);

CREATE INDEX IF NOT EXISTS eng_osm_cat_idx ON convergeo_engine.osm_pois (categoria);
CREATE INDEX IF NOT EXISTS eng_osm_geom_gix ON convergeo_engine.osm_pois USING GIST (geom);

CREATE TABLE IF NOT EXISTS convergeo_engine.scores (
  h3_index text NOT NULL,
  segmento text NOT NULL,
  score_estrutural double precision,
  score_macroeconomico double precision,
  score_comportamental double precision,
  score_total double precision,
  PRIMARY KEY (h3_index, segmento)
);

CREATE INDEX IF NOT EXISTS eng_scores_seg_total_idx ON convergeo_engine.scores (segmento, score_total DESC);

CREATE TABLE IF NOT EXISTS convergeo_engine.geo_cache_cep (
  cep char(8) PRIMARY KEY,
  lat double precision,
  lng double precision,
  status text NOT NULL DEFAULT 'ok',
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS convergeo_engine.geo_cache_endereco (
  query_norm text PRIMARY KEY,
  lat double precision,
  lng double precision,
  status text NOT NULL DEFAULT 'ok',
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS convergeo_engine.municipios_rf (
  codigo_tom text PRIMARY KEY,
  codigo_ibge char(7) NOT NULL,
  nome text,
  uf char(2)
);

CREATE TABLE IF NOT EXISTS convergeo_engine.etl_execucoes (
  id bigserial PRIMARY KEY,
  etapa text NOT NULL,
  arquivo text,
  offset_linhas bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ok',
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
