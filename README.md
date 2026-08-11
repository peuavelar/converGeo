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
│   ├── components/          # UI (mapa, marketplace, opportunity, zillow)
│   ├── data/                # Mocks (regiões, listings, bairros)
│   ├── hooks/               # Ex.: typewriter da busca
│   ├── services/            # nearbyPlaces, regionsApi, routing
│   ├── utils/               # scores, ícones de mapa
│   ├── page.tsx             # Shell principal
│   └── globals.css
├── public/                  # PWA, avatares, assets
├── reference-api/           # Referência FastAPI (opcional)
├── VERSION.md               # Histórico de releases
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
| POIs no mapa | **Overpass** | https://overpass-api.de/api/interpreter · [Overpass Turbo](https://overpass-turbo.eu/) |
| Busca de endereço | **Nominatim** | https://nominatim.openstreetmap.org/ |
| Política Overpass | OSMF | https://operations.osmfoundation.org/policies/overpass/ |

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
