# ConverGeo

**Inteligência imobiliária e geoespacial para Salvador (BA)**

Frontend web (Next.js) do ConverGeo: mapa interativo, opportunity/match scores, marketplace de imóveis, tempo de deslocamento e locais próximos via OpenStreetMap.

Repositório: [github.com/peuavelar/converGeo](https://github.com/peuavelar/converGeo)

## Funcionalidades

- Mapa MapLibre + Deck.gl (pins de preço estilo marketplace)
- Ferramentas: **Para você**, **Tempo**, **Regiões**, **Comparar**
- Card no clique do mapa com imóveis à venda + dados do bairro
- Locais próximos reais (restaurantes, hospitais, delegacias, escolas) via **Overpass / OpenStreetMap**
- Sino Analytics (assistente de regiões)
- Layout responsivo + PWA (mobile e desktop)

## Stack

| Camada | Tecnologia |
|--------|------------|
| App | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS 4 |
| Mapa | MapLibre GL, Deck.gl, react-map-gl |
| Dados locais | Mocks Salvador + H3 (negócio) |
| POIs públicos | OpenStreetMap Overpass API |
| Geocode | Nominatim OSM |

## Estrutura

```
convergeo-front/
├── app/
│   ├── api/geo/             # BFF OSM (nearby, geocode, reverse) + health
│   ├── components/          # UI (mapa, marketplace, opportunity, zillow)
│   ├── data/                # Mocks (regiões, listings, bairros)
│   ├── hooks/
│   ├── services/            # Cliente UI → BFF / mocks
│   ├── page.tsx
│   └── globals.css
├── lib/
│   ├── config/              # DATA_PROVIDER, env
│   ├── geo/                 # Contratos JSON (Python-ready)
│   ├── osm/                 # Overpass + Nominatim
│   ├── providers/           # osm | backend | hybrid
│   └── cache/
├── docs/DATA_ARCHITECTURE.md
├── .env.example
├── public/
└── package.json
```

## Como rodar

```bash
git clone https://github.com/peuavelar/converGeo.git
cd converGeo
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Variáveis de ambiente

Crie `.env.local` (não versionado):

```env
NEXT_PUBLIC_API_URL=https://convergeo.onrender.com
```

Sem API, o modo imóvel usa mocks locais de Salvador.

## APIs públicas (verificar dados)

| Uso | API | Docs / teste |
|-----|-----|----------------|
| POIs no mapa | **Overpass** (via `/api/geo/nearby`) | https://overpass-api.de/api/interpreter · [Overpass Turbo](https://overpass-turbo.eu/) |
| Busca de endereço | **Nominatim** (via `/api/geo/geocode`) | https://nominatim.openstreetmap.org/ |
| Projeto OSM | GitHub | https://github.com/openstreetmap |
| Política Overpass | OSMF | https://operations.osmfoundation.org/policies/overpass/ |

Arquitetura BFF + motor Python: [docs/DATA_ARCHITECTURE.md](./docs/DATA_ARCHITECTURE.md)

Healthcheck local:

```bash
curl http://localhost:3000/api/health
```

No app, ao clicar no mapa, o selo indica **Dados: OpenStreetMap** ou **Estimativa** (fallback).

## Scripts

```bash
npm run dev      # desenvolvimento
npm run build    # build de produção
npm run start    # servir build
npm run lint     # ESLint
```

## Versão

Ver [VERSION.md](./VERSION.md) — atual: **1.1.0** (+ melhorias de UX mapa/marketplace nesta branch).

## Licença / crédito

MVP alinhado ao ecossistema ConverGeo (inteligência geoespacial Salvador). Dados de mapa © contribuidores [OpenStreetMap](https://www.openstreetmap.org/copyright).
