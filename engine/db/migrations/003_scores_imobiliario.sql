-- 003_scores_imobiliario.sql
CREATE TABLE IF NOT EXISTS convergeo.scores_imobiliario (
  h3_index text NOT NULL,
  perfil text NOT NULL CHECK (perfil IN ('moradia', 'investidor', 'incorporadora')),
  score_total double precision,
  estrutural double precision,
  macroeconomica double precision,
  acessibilidade double precision,
  mercado double precision,
  cobertura jsonb NOT NULL DEFAULT '{}'::jsonb,
  versao text NOT NULL DEFAULT 'v2',
  calculado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (h3_index, perfil)
);
