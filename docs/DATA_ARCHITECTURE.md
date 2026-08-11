# Arquitetura de dados — ConverGeo Web

Versão documentada para evoluir o front sem travar no mock, com OpenStreetMap
já funcional e um encaixe limpo para o motor Python / FastAPI.

## Visão geral

```
┌──────────────────────┐
│  UI (app/page.tsx)   │
│  mapa · busca · POIs │
└──────────┬───────────┘
           │ fetch('/api/geo/...')
┌──────────▼───────────┐
│  BFF Next.js         │  app/api/geo/*
│  cache + User-Agent  │
└──────────┬───────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
 OpenStreetMap   Backend Python
 Overpass        GET /nearby
 Nominatim       GET /geocode
                 GET /reverse
```

Troca de fonte **sem mudar a UI**:

| `DATA_PROVIDER` | Comportamento |
|-----------------|---------------|
| `osm` (padrão)  | Overpass + Nominatim |
| `backend`       | Só `BACKEND_ORIGIN` |
| `hybrid`        | Backend → fallback OSM |

## Código versionado

| Caminho | Papel |
|---------|--------|
| `lib/config/dataSources.ts` | Env / modo |
| `lib/geo/types.ts` | Contratos JSON compartilháveis com Python |
| `lib/osm/overpass.ts` | Cliente Overpass |
| `lib/osm/nominatim.ts` | Cliente Nominatim |
| `lib/providers/*` | Interface + factory OSM/backend/hybrid |
| `app/api/geo/nearby` | POIs no mapa |
| `app/api/geo/geocode` | Busca de endereço |
| `app/api/geo/reverse` | Reverse geocode |
| `app/api/health` | Healthcheck local/Vercel |
| `app/services/nearbyPlaces.ts` | Cliente UI → BFF |

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

## Contrato para o motor Python

O backend deve expor (mesmos nomes/campos):

### `GET /nearby?lat=&lng=&radius_m=`

```json
{
  "places": [
    {
      "id": "py-1",
      "name": "Hospital Exemplo",
      "category": "hospital",
      "lat": -12.97,
      "lng": -38.50,
      "distanceM": 420
    }
  ],
  "source": "backend",
  "fetchedAt": "2026-08-11T12:00:00.000Z",
  "radiusM": 1500,
  "center": { "lat": -12.9714, "lng": -38.5014 }
}
```

`category`: `restaurante` | `hospital` | `delegacia` | `escola`

### `GET /geocode?q=&limit=`

```json
[{ "lat": -13.00, "lng": -38.45, "name": "Pituba", "source": "backend" }]
```

ou `{ "hits": [ ... ] }` — o BFF backend provider espera array direto hoje;
ao plugar Python, alinhar com `createBackendGeoProvider` em `lib/providers/osmAndBackend.ts`.

### `GET /reverse?lat=&lng=`

```json
{
  "lat": -12.97,
  "lng": -38.50,
  "displayName": "...",
  "suburb": "Barra",
  "source": "backend"
}
```

### Env

```env
DATA_PROVIDER=hybrid
BACKEND_ORIGIN=http://127.0.0.1:8000
OSM_USER_AGENT=ConverGeo/1.1 (seu-email-ou-repo)
```

`next.config.ts` já faz rewrite `/backend/:path*` → `BACKEND_ORIGIN`.

## Importar dados do motor (batch)

Opções futuras (sem quebrar o front):

1. Python grava GeoJSON/Parquet → endpoint `/regions` ou arquivo em `public/data/`
2. Python alimenta Supabase/PostGIS → `regionsApi.ts` troca mock por `fetch`
3. ETL gera `regions.mock.ts` / listings via script CI

O contrato de regiões continua em `app/types/region.ts` + `app/services/regionsApi.ts`.

## Próximos passos sugeridos

1. Manter `DATA_PROVIDER=osm` em local até o FastAPI subir  
2. Implementar `/nearby` no Python com o JSON acima  
3. Ligar `DATA_PROVIDER=hybrid` e validar selo `backend` no mapa  
4. Migrar ranking/scores de `regionsApi` para o mesmo backend
