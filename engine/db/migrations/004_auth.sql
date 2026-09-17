-- 004_auth.sql — papéis e vínculos (Supabase Auth user_id)
CREATE TABLE IF NOT EXISTS convergeo_engine.perfis_usuario (
  user_id uuid PRIMARY KEY,
  papel text NOT NULL CHECK (papel IN (
    'admin', 'imobiliaria', 'corretor', 'proprietario', 'incorporadora', 'comprador', 'pendente'
  )),
  nome text,
  creci text,
  anunciante_id uuid REFERENCES convergeo_engine.anunciantes (id),
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS convergeo_engine.anunciante_membros (
  anunciante_id uuid NOT NULL REFERENCES convergeo_engine.anunciantes (id),
  user_id uuid NOT NULL,
  papel_no_anunciante text NOT NULL,
  PRIMARY KEY (anunciante_id, user_id)
);

-- RLS só no Supabase (schema auth). A API FastAPI checa papel + posse em código.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    EXECUTE 'ALTER TABLE convergeo_engine.perfis_usuario ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE convergeo_engine.imoveis ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE convergeo_engine.anunciante_membros ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
