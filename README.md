# ConverGeo

**Inteligência imobiliária e geoespacial para Salvador e Lauro de Freitas (BA)**

[![Version](https://img.shields.io/badge/version-1.3.0-0a0a0b)](./VERSION.md)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![MapLibre](https://img.shields.io/badge/MapLibre-Deck.gl-006aff)](https://maplibre.org/)
[![License](https://img.shields.io/badge/license-private-lightgrey)](#)

Frontend web do [ConverGeo](https://github.com/peuavelar/converGeo): mapa interativo, opportunity/match scores, marketplace, tempo de deslocamento e locais próximos via OpenStreetMap. O motor de score e ingestão imobiliária vive em [`engine/`](./engine).

---

## Modos

| Modo | O que faz |
|------|-----------|
| **Comprar** | Explorar imóveis, orçamento, regiões, rotas e marketplace |
| **Abrir meu Negócio** | Heatmap H3, Top 5, análise pontual e comparação A/B por região |

Ao trocar de modo, o mapa mostra um estado de carregamento com transição suave (evita parecer bug).

## Destaques (v1.3.0)

- Motor Python no mesmo repo (`engine/`): ETL H3 mascarado, renda Censo 2022, CNPJ geocodificado, OSM
- Marketplace: CSV/VRSync, preço justo etapa A, página `/anuncie`
- Flag `NEXT_PUBLIC_MARKETPLACE_SOURCE=mock|api` (padrão mock)
- Modo Negócio continua em `GET /score` e `GET /top`

Ver [CHANGELOG.md](./CHANGELOG.md), [VERSION.md](./VERSION.md), [contexto.md](./contexto.md) e [docs/DATA_ARCHITECTURE.md](./docs/DATA_ARCHITECTURE.md).

## Stack

| Camada | Tecnologia |
|--------|------------|
| App | Next.js 16 · React 19 · TypeScript |
| UI | Tailwind CSS 4 |
| Mapa | MapLibre GL · Deck.gl · react-map-gl |
| Dados | Mocks regionais · H3 · OSM Overpass · FastAPI `engine/` |
| Geo | Nominatim · BFF `/api/geo/*` |

## Estrutura

```
converGeo/
├── app/
│   ├── api/                 # BFF geo, cron benchmarks, marketplace scores
│   ├── components/          # mapa, marketplace, opportunity, views, zillow
│   ├── hooks/               # nearby, negócio, scores
│   ├── map/                 # builders de camadas Deck.gl
│   ├── data/                # bairros, listings, filtros
│   ├── services/            # cliente UI → BFF
│   └── page.tsx             # shell do app
├── lib/
│   ├── benchmarks/          # coleta + score calibrado (S1)
│   ├── negocio/             # compare A/B + fetch hex
│   ├── osm/ · providers/ · geo/
├── data/benchmarks/         # snapshots JSON (opcional)
├── engine/                  # FastAPI + ETL + marketplace
├── docs/                    # arquitetura, ADRs, benchmarks
├── scripts/                 # seed / compare / testes
└── package.json             # v1.3.0
```

## Como rodar

```bash
git clone https://github.com/peuavelar/converGeo.git
cd converGeo
npm install
cp .env.example .env.local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Variáveis

Veja [`.env.example`](./.env.example). Sem API Python, o modo imóvel usa mocks locais.

Flags úteis:

```env
ENABLE_EXTERNAL_BENCHMARK=false
NEXT_PUBLIC_ENABLE_EXTERNAL_BENCHMARK=false
```

## Scripts

```bash
npm run dev               # desenvolvimento
npm run build             # produção
npm run lint              # ESLint
npm run test:benchmarks   # regras de calibração
npm run engine:test       # pytest do motor
npm run seed:benchmarks   # gera snapshots locais
```

## Dados públicos

| Uso | Via app | Origem |
|-----|---------|--------|
| POIs no mapa | `/api/geo/nearby` | [Overpass](https://overpass-api.de/api/interpreter) |
| Geocode | `/api/geo/geocode` | [Nominatim](https://nominatim.openstreetmap.org/) |
| Arquitetura BFF | — | [docs/DATA_ARCHITECTURE.md](./docs/DATA_ARCHITECTURE.md) |
| Benchmarks | flag | [docs/BENCHMARKS.md](./docs/BENCHMARKS.md) |

```bash
curl http://localhost:3000/api/health
```

## Documentação

| Doc | Conteúdo |
|-----|----------|
| [contexto.md](./contexto.md) | contexto completo da 1.3.0 (agentes / equipe) |
| [docs/RELEASE_1.2.0.md](./docs/RELEASE_1.2.0.md) | release notes detalhadas |
| [VERSION.md](./VERSION.md) | release atual |
| [CHANGELOG.md](./CHANGELOG.md) | histórico de versões |
| [docs/DATA_ARCHITECTURE.md](./docs/DATA_ARCHITECTURE.md) | BFF + motor Python |
| [docs/BENCHMARKS.md](./docs/BENCHMARKS.md) | score calibrado (A+S1) |

## Créditos

MVP ConverGeo — Salvador / RMS. Dados de mapa © contribuidores [OpenStreetMap](https://www.openstreetmap.org/copyright).
