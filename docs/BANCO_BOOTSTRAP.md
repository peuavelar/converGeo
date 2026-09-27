# Banco nosso no modelo Thiago (bootstrap)

Decisões validadas (2026-09-27):

1. Criar o banco **do zero** (sem dump do Thiago).  
2. Mesmo modelo: Postgres + PostGIS + schema `convergeo` + `GET /score` + `GET /top`.  
3. Manter os **17 segmentos** do front. IBGE/Receita entram depois.  
4. Comprar continua mock + OSM.  
5. Sem scrape de portal.  
6. Só Salvador no Demo Day.

## O que o bootstrap grava agora

| Tabela | Fonte atual | Depois |
|--------|-------------|--------|
| `hexagonos` | Bbox Salvador res 8 (`fonte=bbox_salvador`, ~1077 células) | Malha IBGE oficial |
| `osm_pois` | Overpass | Mesma API, recorte maior |
| `scores` | Só camada comportamental (OSM), 17 segmentos | + estrutural (IBGE) + macro (CNPJ) |
| `demografico` / `empresas` | Vazias | ETL oficial (ZIPs, sem versionar no git) |

## Subir local

```bash
cd engine
docker compose up -d
export DATABASE_URL=postgresql://postgres:convergeo@127.0.0.1:5432/convergeo
python -m pip install -e ".[dev]"
python -m convergeo_engine.cli migrate
python -m convergeo_engine.cli bootstrap
curl "http://127.0.0.1:8000/top?segmento=food_service&limit=5"
```

(`serve` em outro terminal.)

## 0. Duas camadas de “conexão”

| Camada | Variáveis | Para quê |
|--------|-----------|----------|
| **API** (`@supabase/server`) | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWKS_URL` | Auth, REST, painel JS |
| **Postgres** (motor / hexágonos) | `DATABASE_URL` (URI Session/Direct) | Schema `convergeo`, PostGIS, `/score` `/top` |

MCP do projeto (Cursor local): `.cursor/mcp.json` aponta para
`https://mcp.supabase.com/mcp?project_ref=jhbzotgjpfxfajvjgnuu`.
No Cursor do teu Mac/PC: **Approve** o servidor → `agent mcp login supabase`.
Neste Cloud Agent o MCP remoto **não autentica sozinho**.

As API keys **não** substituem `DATABASE_URL`. O mapa H3 só enche depois do Postgres.

Handshake da API (com `.env.local`): `GET /api/supabase/health`.

## 0b. Conectar ao Postgres (ainda falta)

Neste ambiente **não há `DATABASE_URL`**. Sem a URI o handshake não roda.

No dashboard do projeto novo:

1. **Project Settings → Database → Connect** (ou o botão Connect).  
2. Copiar a URI **Session pooler** (`*.pooler.supabase.com:5432`) **ou Direct** (`db.<ref>.supabase.co:5432`).  
   Evite Transaction mode (`:6543`) para migrate/bootstrap.  
3. Database → Extensions → ligar **postgis**.  
4. Colar a URI em `DATABASE_URL` (secret do Cursor / Render). Não commitar.  
5. Conferir:

```bash
cd engine
export DATABASE_URL='postgresql://postgres.<ref>:<senha>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres'
python -m convergeo_engine.cli db-ping
```

Esperado: `{"ok": true, "mode": "session"|"direct", "postgis": "..."}`.  
Só depois: `migrate` + `bootstrap`.

## Atalho sem URI (SQL Editor)

Enquanto `DATABASE_URL` e o MCP não autenticam neste agente:

1. Supabase → **SQL Editor** → colar `engine/db/supabase_init.sql` → Run.  
2. Gerar a grade (neste repo):

```bash
cd engine
python -m convergeo_engine.cli export-sql --skip-osm
```

3. Correr `engine/db/seed/seed_hexagonos.sql` e `seed_scores.sql` no mesmo Editor.  
4. Table Editor: `convergeo.hexagonos` deve ter ~1077 linhas.

## Subir no Supabase + Render

1. Projeto Supabase novo (região `sa-east-1`).  
2. Database → Extensions → ligar **postgis**.  
3. Copiar a URI (pooler 6543 ou direto 5432) para `DATABASE_URL` **só** no Render — nunca no git.  
4. No Render, o start deve ser:

```bash
python -m convergeo_engine.cli migrate && python -m convergeo_engine.cli bootstrap && python -m convergeo_engine.cli serve
```

`bootstrap` é idempotente (UPSERT). Overpass pode falhar; a grade e os scores (neutros 5.0 se não houver POI) ainda gravam.

5. Conferir `GET https://<render>/health` com `hexagonos` > 0 e `scores` > 0.  
6. Vercel: `BACKEND_ORIGIN` = URL do Render. O BFF já faz fallback demo se o motor cair.
