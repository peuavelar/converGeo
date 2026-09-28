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

## 0b. Conectar ao Postgres

O schema `convergeo` já está no projeto `jhbzotgjpfxfajvjgnuu`
(1077 hexágonos, 18309 scores, 17 segmentos).

URI Session (trocar `SENHA`; `!` → `%21`, `@` → `%40`):

```
postgresql://postgres.jhbzotgjpfxfajvjgnuu:SENHA@aws-0-ca-central-1.pooler.supabase.com:5432/postgres?sslmode=require
```

Evite Transaction mode (`:6543`). Não commitar a URI.

```bash
cd engine
export DATABASE_URL='postgresql://postgres.jhbzotgjpfxfajvjgnuu:SENHA@aws-0-ca-central-1.pooler.supabase.com:5432/postgres?sslmode=require'
python -m convergeo_engine.cli db-ping
```

Esperado: `{"ok": true, "mode": "session"|"direct", "postgis": "..."}`.

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
3. URI Session deste projeto (trocar `SENHA`; se a senha tiver `@ # %` etc., percent-encode):

```
postgresql://postgres.jhbzotgjpfxfajvjgnuu:SENHA@aws-0-ca-central-1.pooler.supabase.com:5432/postgres?sslmode=require
```

Colar a mesma URI em `DATABASE_URL` no **Render** (motor Python) e na **Vercel** (BFF). Nunca no git.

4. No Render, o start deve ser:

```bash
python -m convergeo_engine.cli migrate && python -m convergeo_engine.cli bootstrap && python -m convergeo_engine.cli serve
```

`bootstrap` é idempotente (UPSERT). Overpass pode falhar; a grade e os scores (neutros 5.0 se não houver POI) ainda gravam.

5. Conferir `GET https://<render>/health` com `hexagonos` > 0 e `scores` > 0.

## 4. Vercel (ciclo do mapa)

O BFF (`/api/negocio/score` e `/top`, rewrites `/backend/*`) resolve **postgres → PostgREST (`public.scores`) → Render → demo**.

A Production (`master`) ainda não tem este BFF — o `/backend/score` vai ao Render do tenant morto. O Preview deste branch está atrás do SSO da Vercel.

Para o mapa sair do 500 sem o Render:

1. Vercel → **convergeo-front** (`prj_5EKlmx8L1mHg9Q3FMZP2upfHE4Vj`) → Environment Variables.  
2. Production + Preview + Development:
   - `DATABASE_URL` (URI Session percent-encoded + `sslmode=require`), **ou**
   - `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` (lê `public.scores`).  
3. Sem `VERCEL_TOKEN` neste agente o upsert automático não corre. Localmente: `VERCEL_TOKEN=… npm run vercel:env` (lê `.env.local` e faz deploy de produção deste branch).  
4. Promover o Preview para Production **ou** mergear este PR em `master` (branch de produção Hobby).  
5. Conferir:

```bash
curl -sS https://convergeo-front.vercel.app/api/negocio/health
# {"status":"ok","version":"1.3.3","motor":"postgres","demo":false}

curl -sSI "https://convergeo-front.vercel.app/api/negocio/top?segmento=food_service&limit=3"
# X-ConverGeo-Source: postgres
```

Ordem de resolução: **postgres → Render → demo**.  
`GET /api/negocio/health` com `"motor":"postgres"` significa que o banner demo some.
