# Seed Salvador (SQL Editor)

1. Correr `../supabase_init.sql`
2. Correr `seed_hexagonos.sql` (~1077 hexes)
3. Ou, no SQL Editor, o `INSERT … SELECT` a partir de `hexagonos` (mais fiável que colar 18k linhas)

Gerar de novo: `python -m convergeo_engine.cli export-sql --skip-osm`
