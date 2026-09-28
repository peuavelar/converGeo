-- Views em public para o PostgREST da Vercel (schema convergeo não é exposto).
-- GRANT SELECT ao anon: basta SUPABASE_PUBLISHABLE_KEY no BFF.

CREATE OR REPLACE VIEW public.scores AS
SELECT
  h3_index,
  segmento,
  score_estrutural,
  score_macroeconomico,
  score_comportamental,
  score_total
FROM convergeo.scores;

CREATE OR REPLACE VIEW public.hexagonos AS
SELECT h3_index, municipio_ibge, lat, lng
FROM convergeo.hexagonos;

GRANT SELECT ON public.scores TO anon, authenticated, service_role;
GRANT SELECT ON public.hexagonos TO anon, authenticated, service_role;
