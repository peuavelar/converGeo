# Contexto — ConverGeo (estado atual)

Corte: **2026-09-28**. Versão **1.3.2**. Repo [peuavelar/converGeo](https://github.com/peuavelar/converGeo). Produção: https://convergeo-front.vercel.app

Este arquivo descreve **o pé do projeto agora**. O que está no código e o que está no ar não são a mesma coisa.

---

## Produto

Inteligência imobiliária e geoespacial. Dois modos:

| Modo | ID | O que o usuário faz hoje |
|------|----|--------------------------|
| **Comprar** | `imovel` | Mapa, orçamento, regiões, rotas, POIs OSM. Listings = **mock**. |
| **Abrir meu Negócio** | `negocio` | Heatmap H3, Raio-X / Top 5, clique, CSV da matriz, A/B por **digitação** (não por clique). |

Recorte vivo: **Salvador (BA)**. Lauro de Freitas está nos códigos IBGE do motor (`2919207`) e **não** entra no heatmap.

Políticas em vigor:

- Sem scrape de portal (Gecko/OLX removidos).
- Marketplace = imóveis próprios; `NEXT_PUBLIC_MARKETPLACE_SOURCE=mock`.
- Benchmarks externos (`ENABLE_EXTERNAL_BENCHMARK`) **off**.
- Transição Comprar ↔ Negócio obrigatória.
- Motor = FastAPI em `engine/` (não Java).

---

## Pé operacional (o que está no ar)

| Peça | Estado |
|------|--------|
| Front Vercel `convergeo-front` | no ar |
| Mapa modo escuro (padrão) | no ar |
| Hexágonos `PolygonLayer` + `h3-js` res 8 | no ar |
| Recorte visual pitch | até **160** hexes na península (`keepHeatmapHexes`); o banco tem ~1077 |
| PWA `convergeo-v1.3.3` | network-first; **não** cacheia `/api` nem `/backend` |
| BFF `/api/negocio/score`, `/top`, `/health` | no ar neste branch; resolve **postgres → PostgREST `public.scores` → Render → demo** |
| `DATABASE_URL` Session pooler (Supabase `jhbzotgjpfxfajvjgnuu`) | schema `convergeo` + PostGIS |
| Tenant antigo Render `postgres.hfgzdoppryfuufyouehi` | **morto** — não usar |
| `master` / Production Hobby | ainda aponta `/backend` ao Render morto se este BFF não estiver mergeado |
| Score no banco | **só camada comportamental (OSM)**; `fonte=osm_comportamental` |
| IBGE / CNPJ no banco | tabelas `demografico` e `empresas` **vazias** |
| Comprar | mock + Overpass/Nominatim ao vivo |

Volumes no schema atual:

| Tabela | Qtde | Fonte |
|--------|------|--------|
| `hexagonos` | ~1077 | bbox Salvador res 8, `fonte=bbox_salvador` |
| `scores` | 18309 | 1077 × 17 segmentos |
| `osm_pois` | lote Overpass do bootstrap | não citar número sem consultar a tabela |
| `demografico` / `empresas` | 0 | ETL oficial pendente |

Bbox da grade (`etl/bbox_grade.py`): lat −13,0108…−12,7442; lng −38,5762…−38,2891. Não é malha municipal IBGE. `pct_area_terrestre` = interseção com o retângulo.

Fluxo Negócio na UI: **segmento → Raio-X → CSV** (`docs/TUTORIAL_EXTRACAO.md`). Endereço = um ponto; A/B = dois bairros.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| App | Next.js 16 · React 19 · TypeScript · Tailwind 4 |
| Mapa | MapLibre · Deck.gl · react-map-gl · h3-js |
| BFF | rotas `app/api/*` na Vercel (`nodejs`, `no-store`) |
| Motor | Python 3.11+ FastAPI, Pydantic v2, schema `convergeo` |
| Banco | Postgres + PostGIS (Supabase); pooler Session `:5432` |
| Geo vivo (Comprar) | Overpass + Nominatim via `/api/geo/*` |

Onde mexer:

```
app/page.tsx                 shell + modos
app/api/negocio/             BFF score / top / health
app/api/geo/                 OSM
app/map/buildMapLayers.ts    camadas Deck.gl
app/data/segments.ts         17 segmentos UI
lib/negocio/                 pg, rest, demo, hexStyle, compare A/B
engine/convergeo_engine/     ETL, score v1/v2, API
engine/db/migrations/        DDL
docs/adr/                    decisões de método
docs/BANCO_BOOTSTRAP.md      como o banco foi levantado
```

---

## Score — o que o código define vs o que o mapa mostra

Pesos nominais v1 (`PESOS_V1`): estrutural **0,35** (IBGE) · macro **0,40** (CNPJ/CNAE) · comportamental **0,25** (OSM).

`combine` ignora camada `null` e renormaliza. **Hoje só OSM entra** → `score_total` = comportamental (min-max 0–10 no segmento; tudo igual → 5,0).

Contrato do front (inalterado):

- `GET /score?lat=&lng=&segmento=`
- `GET /top?segmento=&limit=`
- JSON: `status`, `h3_index`, `breakdown.{estrutural,macroeconomico,comportamental}`

Header `X-ConverGeo-Source`: `postgres` | `rest` | `upstream` | `demo`.

17 segmentos (id = front = motor), CNAE de referência no seletor:

| id | rótulo | CNAE UI |
|----|--------|---------|
| food_service | Restaurantes | 56.11-2 |
| padaria | Padaria e confeitaria | 10.91-1 |
| cafe | Café e lanchonete | 56.11-2/02 |
| farmacia | Farmácia e drogaria | 47.71-7 |
| clinica | Clínica médica | 86.30-5 |
| otica | Ótica | 47.74-1 |
| academia | Academia e fitness | 93.13-1 |
| beleza | Salão de beleza | 96.02-5 |
| vestuario | Vestuário e moda | 47.81-4 |
| supermercado | Supermercado e minimercado | 47.11-3 |
| pet | Pet shop | 47.89-0/04 |
| papelaria | Papelaria e livros | 47.61-0 |
| construcao | Material de construção | 47.44-0 |
| posto | Posto de combustível | 47.31-8 |
| hotel | Hotelaria | 55.10-8 |
| educacao | Educação e cursos | 85.99-6 |
| imobiliaria | Imobiliária | 68.21-8 |

Prefixos CNAE e tags OSM: `engine/convergeo_engine/segments.py`.

Score **v2** (perfis moradia / investidor / incorporadora, preço justo, `/v2/*`) existe no motor e **não** alimenta o heatmap Negócio. Marketplace API atrás da flag, padrão mock.

---

## O que o motor já implementa (ainda não no banco vivo)

Código + testes; paths oficiais por env; **zips IBGE/Receita fora do git**.

| Módulo | Arquivo / ADR | Depende de |
|--------|---------------|------------|
| Grade mascarada malha IBGE `CD_MUN` | `etl/grade.py` · ADR 0001 | `IBGE_MALHA_PATH` |
| Rateio setor × hex por área | `etl/ibge.py` · ADR 0002 | setores GeoJSON |
| Renda Censo 2022 (responsável, não densidade) | ADR 0003 | `IBGE_RENDA_PATH` |
| CNPJ todos os `Estabelecimentos*` + TOM + geocode | `etl/cnpj.py` · ADR 0004 | `RF_CNPJ_DIR` |
| Winsorize p5–p95 no v2 | ADR 0005 | ETL real |
| LGPD marketplace (sem documento/telefone PF) | ADR 0006 | fluxo Anuncie |

Códigos oficiais conferidos: IBGE Salvador `2927408` / Lauro `2919207`; TOM Receita `3849` / `3685`.

Diferença em relação ao motor Thiago (não copiado): 4 segmentos vs 17; renda = densidade vs Censo; um ZIP vs todos; geocode dicionário de bairro vs CEP→endereço→bairro ponderado. Detalhe em `docs/CHECKIN_ESPELHO_THIAGO.md`.

---

## Números

Só citar o que `docs/PITCH_NUMEROS.md` marca verificado, ou o volume do bootstrap acima.

| Item | Estado |
|------|--------|
| IBGE / TOM | verificado |
| 1077 como malha oficial | **não** — é bbox |
| p95 API < 800 ms | A VERIFICAR |
| Correlação score v2 | não forçar até ETL |

---

## Flags e comandos

```env
DATA_PROVIDER=osm
NEXT_PUBLIC_MARKETPLACE_SOURCE=mock
ENABLE_EXTERNAL_BENCHMARK=false
NEXT_PUBLIC_ENABLE_EXTERNAL_BENCHMARK=false
```

`DATABASE_URL` e chaves Supabase só em Vercel/Render/`.env.local`. Session `:5432`, senha percent-encoded. Não Transaction `:6543`.

```bash
npm run dev
npm run test:benchmarks
npm run engine:test
cd engine && python -m convergeo_engine.cli migrate && python -m convergeo_engine.cli bootstrap
```

---

## Docs de apoio

| Arquivo | Conteúdo |
|---------|----------|
| [docs/DATA_ARCHITECTURE.md](./docs/DATA_ARCHITECTURE.md) | BFF + contratos v1/v2 |
| [docs/BANCO_BOOTSTRAP.md](./docs/BANCO_BOOTSTRAP.md) | Postgres `convergeo` |
| [docs/TUTORIAL_EXTRACAO.md](./docs/TUTORIAL_EXTRACAO.md) | segmento → Raio-X → CSV |
| [docs/adr/](./docs/adr/) | ADRs 0001–0006 |
| [docs/PITCH_NUMEROS.md](./docs/PITCH_NUMEROS.md) | números citáveis |
| [docs/BENCHMARKS.md](./docs/BENCHMARKS.md) | asking, flag off |
| [docs/CHECKIN_ESPELHO_THIAGO.md](./docs/CHECKIN_ESPELHO_THIAGO.md) | o que não copiar |
| [engine/README.md](./engine/README.md) | CLI do motor |
| [CHANGELOG.md](./CHANGELOG.md) / [VERSION.md](./VERSION.md) | SemVer (VERSION ainda fala Render/demo; o BFF postgres é deste ramo) |

---

## Próximo pé técnico (ainda não feito)

1. `etl all` com malha IBGE + Censo 2022 + CNPJ completo (zips locais, sem git).
2. Preencher `demografico` / `empresas` e passar o v1 a três camadas.
3. Merge deste BFF em `master` (ou promover Preview) para a Production Hobby não cair no Render morto.
4. Lauro na grade.
5. Marketplace `api` quando o jurídico/LGPD do Anuncie fechar.
6. Ligar benchmarks S1 só com n≥8 e flag explícita.
