# Arquitetura de dados — ConverGeo Web v1.3.0

Versão documentada para o front Next.js e o motor Python no mesmo repositório.

## Visão geral

```
┌──────────────────────┐
│  UI (app/page.tsx)   │
│  mapa · busca · POIs │
└──────────┬───────────┘
           │ fetch('/api/geo/...')  fetch('/backend/...')
┌──────────▼───────────┐
│  BFF Next.js         │  app/api/geo/*  + rewrite /backend
│  cache + User-Agent  │
└──────────┬───────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
 OpenStreetMap   engine/ FastAPI (fonte de verdade do score)
 Overpass        GET /score  GET /top          (v1 Negócio)
 Nominatim       GET /v2/score  /v2/imoveis    (marketplace)
                 POST /v2/ingest/planilha
```

Troca de fonte **sem mudar a UI**:

| `DATA_PROVIDER` | Comportamento |
|-----------------|---------------|
| `osm` (padrão)  | Overpass + Nominatim |
| `backend`       | Só `BACKEND_ORIGIN` |
| `hybrid`        | Backend → fallback OSM |

Marketplace:

| `NEXT_PUBLIC_MARKETPLACE_SOURCE` | Comportamento |
|----------------------------------|---------------|
| `mock` (padrão) | `app/data/marketplaceListings.ts` |
| `api` | `GET /backend/v2/imoveis` com fallback para mock se a API falhar |

## Código versionado

| Caminho | Papel |
|---------|--------|
| `lib/config/dataSources.ts` | Env / modo geo |
| `lib/geo/types.ts` | Contratos JSON compartilháveis |
| `lib/osm/overpass.ts` | Cliente Overpass |
| `lib/osm/nominatim.ts` | Cliente Nominatim |
| `lib/providers/*` | Interface + factory OSM/backend/hybrid |
| `app/api/geo/nearby` | POIs no mapa |
| `app/api/geo/geocode` | Busca de endereço |
| `app/api/geo/reverse` | Reverse geocode |
| `app/api/health` | Healthcheck local/Vercel |
| `app/services/nearbyPlaces.ts` | Cliente UI → BFF |
| `app/services/marketplaceApi.ts` | Cliente UI → FastAPI v2 |
| `engine/` | Motor: ETL, score, marketplace, FastAPI |
| `docs/adr/` | Decisões metodológicas |

## OpenStreetMap (já ligado)

Projeto: https://github.com/openstreetmap

- **Overpass** — restaurantes, hospitais, delegacias, escolas no clique do mapa  
  https://overpass-api.de/api/interpreter · teste: https://overpass-turbo.eu/
- **Nominatim** — geocode / reverse da busca  
  https://nominatim.openstreetmap.org/  
  Política: https://operations.osmfoundation.org/policies/nominatim/

No mapa, o selo mostra `Dados: OpenStreetMap` ou `Estimativa`.

### Testar local

```bash
npm run dev
curl http://localhost:3000/api/health
curl "http://localhost:3000/api/geo/nearby?lat=-12.9714&lng=-38.5014&radius_m=1500"
curl "http://localhost:3000/api/geo/geocode?q=Pituba"
```

## Motor Python (`engine/`) — fonte de verdade

Substitui `reference-api/`. Deploy típico: **Render** (Docker `engine/Dockerfile` ou `uvicorn`) + **Supabase** (Postgres + PostGIS, schema `convergeo`).

```bash
cd engine
pip install -e ".[dev]"
python -m convergeo_engine.cli migrate
python -m convergeo_engine.cli serve   # http://127.0.0.1:8000
```

ETL (caminhos oficiais via env; **não** versionar zips da Receita/IBGE):

```bash
python -m convergeo_engine.cli etl all
python -m convergeo_engine.cli marketplace ingest-csv --file engine/templates/imoveis_seed_from_mocks.csv
python -m convergeo_engine.cli marketplace aggregate
python -m convergeo_engine.cli scoring compute
python -m convergeo_engine.cli scoring validate
```

### Contrato Negócio (v1, inalterado para o front)

`lib/negocio/fetchHexScores.ts` consome:

- `GET /score?lat=&lng=&segmento=`
- `GET /top?segmento=&limit=`

Resposta de sucesso: `status: "sucesso"`, `h3_index`, `breakdown.{estrutural,macroeconomico,comportamental}`.

### Contrato marketplace (v2)

- `GET /v2/score?lat&lng&perfil`
- `GET /v2/hexagonos?perfil&bbox`
- `GET /v2/imoveis?...`
- `GET /v2/imoveis/{id}`
- `POST /v2/ingest/planilha`
- `POST /v2/anunciantes`
- `POST /v2/anunciantes/{id}/feed/sync`
- `POST /v2/explicar` (LLM opcional; fallback template)

Códigos IBGE verificados: Salvador `2927408`, Lauro de Freitas `2919207`.

## Contrato geo BFF (nearby / geocode)

O BFF Next continua o mesmo. O motor **não** precisa implementar `/nearby` para o mapa OSM.

### Env

```env
DATA_PROVIDER=osm
BACKEND_ORIGIN=http://127.0.0.1:8000
OSM_USER_AGENT=ConverGeo/1.3 (https://github.com/peuavelar/converGeo)
NEXT_PUBLIC_MARKETPLACE_SOURCE=mock
```

`next.config.ts` faz rewrite `/backend/:path*` → `BACKEND_ORIGIN`.

Números de pitch (hexágonos, p95, correlação): ver `docs/PITCH_NUMEROS.md`.
