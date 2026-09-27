# Seed Salvador (SQL Editor)

1. Correr `../supabase_init.sql`
2. Correr `seed_hexagonos.sql` (~1077 hexes)
3. Correr `seed_scores.sql` (17 segmentos; scores 5.0 sem OSM)

Gerar de novo: `python -m convergeo_engine.cli export-sql --skip-osm`
