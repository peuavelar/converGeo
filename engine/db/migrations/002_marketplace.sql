-- 002_marketplace.sql
CREATE TABLE IF NOT EXISTS convergeo.anunciantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('imobiliaria', 'corretor', 'proprietario', 'incorporadora')),
  nome text NOT NULL,
  creci text,
  documento text,
  feed_url text,
  feed_formato text,
  api_key_hash text,
  ativo boolean NOT NULL DEFAULT true,
  is_seed boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS convergeo.imoveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anunciante_id uuid NOT NULL REFERENCES convergeo.anunciantes (id),
  id_externo text NOT NULL,
  finalidade text NOT NULL CHECK (finalidade IN ('venda', 'aluguel')),
  tipo text NOT NULL,
  preco numeric NOT NULL,
  condominio numeric,
  iptu numeric,
  area_util numeric,
  area_total numeric,
  quartos integer,
  suites integer,
  banheiros integer,
  vagas integer,
  ano_construcao integer,
  endereco_logradouro text,
  endereco_numero text,
  endereco_bairro text,
  endereco_cidade text,
  cep text,
  lat double precision,
  lng double precision,
  geom geometry(Point, 4326),
  h3_index text,
  geo_precisao text,
  ocultar_endereco boolean NOT NULL DEFAULT false,
  descricao text,
  fotos jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'vendido', 'alugado', 'removido')),
  qualidade_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  publicado_em timestamptz,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (anunciante_id, id_externo)
);

CREATE INDEX IF NOT EXISTS imoveis_h3_idx ON convergeo.imoveis (h3_index);
CREATE INDEX IF NOT EXISTS imoveis_status_idx ON convergeo.imoveis (status, finalidade);
CREATE INDEX IF NOT EXISTS imoveis_geom_gix ON convergeo.imoveis USING GIST (geom);

CREATE TABLE IF NOT EXISTS convergeo.imovel_eventos (
  id bigserial PRIMARY KEY,
  imovel_id uuid NOT NULL REFERENCES convergeo.imoveis (id),
  evento text NOT NULL CHECK (evento IN ('criado', 'preco_alterado', 'status_alterado', 'vendido')),
  valor_anterior text,
  valor_novo text,
  ocorrido_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS convergeo.transacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id uuid REFERENCES convergeo.imoveis (id),
  valor numeric NOT NULL,
  data date NOT NULL,
  fonte text NOT NULL CHECK (fonte IN ('anunciante', 'publica'))
);

CREATE TABLE IF NOT EXISTS convergeo.precos_hex (
  h3_index text NOT NULL,
  finalidade text NOT NULL,
  tipologia text NOT NULL,
  mediana_m2 numeric,
  p25_m2 numeric,
  p75_m2 numeric,
  n integer NOT NULL,
  dias_mercado_mediana numeric,
  estoque_ativo integer,
  nivel_fallback text NOT NULL CHECK (nivel_fallback IN ('hexagono', 'k_ring_1', 'bairro', 'municipio')),
  calculado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (h3_index, finalidade, tipologia)
);
