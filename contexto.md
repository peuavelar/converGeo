# Contexto — ConverGeo Web v1.3.0

> Documento de contexto para humanos e agentes de IA.  
> Versão: **1.3.0** · Repo: [peuavelar/converGeo](https://github.com/peuavelar/converGeo) · Produção: https://convergeo-front.vercel.app

---

## 1. O que é o produto

ConverGeo é um frontend Next.js de **inteligência imobiliária e geoespacial** focado em **Salvador (BA)** e **Lauro de Freitas (RMS)**, com o **motor de dados no mesmo repositório** (`engine/`).

Dois modos no header:

| Modo | ID interno | Função |
|------|-----------|--------|
| **Comprar** | `imovel` | Marketplace (mocks ou API v2), orçamento, regiões, rotas, POIs OSM |
| **Abrir meu Negócio** | `negocio` | Heatmap H3 via `GET /score` e `GET /top` (contrato v1) |

Stack: Next.js 16 · React 19 · TypeScript · Tailwind 4 · MapLibre · Deck.gl · FastAPI (`engine/`).

---

## 2. Evolução até a 1.2.0 (resumo)

- UX mobile do mapa (bottom sheet, um overlay por vez, tab bar)
- GeckoAPI/OLX descartado (sem scraping de portais)
- Benchmarks externos opcionais (flag off)
- Comparar locais A/B por digitação
- Transição Comprar ↔ Negócio obrigatória
- Autor de commit válido: `peuavelar <pedro745lucas@gmail.com>`

---

## 3. Arquitetura mental (onde mexer)

```
app/page.tsx              → shell UI + orquestra modos
app/anuncie/              → ingestão CSV / feed VRSync
app/hooks/                → nearby, negócio hex/câmera, marketplace scores
app/map/buildMapLayers.ts → Deck.gl layers imóvel/negócio
app/components/zillow/    → header, filter bar, side rail
app/components/map/       → pin card, legend, mode transition
lib/negocio/              → compare A/B + fetch /score|/top
lib/benchmarks/           → coleta, regras, calibração S1
app/api/geo/              → BFF OSM (nearby, geocode, reverse)
app/data/                 → neighborhoods, streets, marketplace mocks
app/services/marketplaceApi.ts → cliente FastAPI v2
engine/                   → ETL, score v2, marketplace, FastAPI
docs/adr/                 → decisões metodológicas
```

**Convenção Next.js:** este repo usa Next 16 com APIs que podem diferir do “Next clássico” — ler `node_modules/next/dist/docs/` e `AGENTS.md` antes de mudanças grandes.

---

## 4. Decisões de produto (não reverter sem pedido)

1. Marketplace = imóveis próprios; `NEXT_PUBLIC_MARKETPLACE_SOURCE=mock` até validar a API. Externos ≠ anúncios (sem scraping).
2. Benchmarks = calibração estatística, flag **off** por padrão
3. Comparação Negócio A/B = **digitação**, não clique no mapa
4. Clique no mapa no Negócio em modo compare = **não define** locais A/B
5. Mobile: um overlay dominante por vez
6. Transição entre modos é obrigatória para UX (não remover sem alternativa)
7. Motor canônico = FastAPI em `engine/` (não Java/Spring)

---

## 5. Flags e scripts úteis

```env
ENABLE_EXTERNAL_BENCHMARK=false
NEXT_PUBLIC_ENABLE_EXTERNAL_BENCHMARK=false
DATA_PROVIDER=osm
BACKEND_ORIGIN=http://127.0.0.1:8000
NEXT_PUBLIC_MARKETPLACE_SOURCE=mock
```

```bash
npm run dev
npm run build
npm run test:benchmarks
npm run engine:test
```

---

## 6. Estado atual (1.3.0)

| Item | Estado |
|------|--------|
| Versão package | 1.3.0 |
| Motor | `engine/` FastAPI v1+v2 |
| Marketplace | mock padrão; API atrás de flag |
| Produção Vercel | convergeo-front.vercel.app |
| Escopo geo | Salvador + Lauro de Freitas |
| Gecko/OLX ads | Removido |
| Pitch números | `docs/PITCH_NUMEROS.md` (vários A VERIFICAR até ETL real) |

---

## 7. Documentação relacionada

| Arquivo | Conteúdo |
|---------|----------|
| [docs/DATA_ARCHITECTURE.md](./docs/DATA_ARCHITECTURE.md) | BFF + motor `engine/` |
| [docs/PITCH_NUMEROS.md](./docs/PITCH_NUMEROS.md) | Origem reproduzível dos números |
| [docs/adr/](./docs/adr/) | ADRs metodológicos |
| [engine/README.md](./engine/README.md) | Como rodar o motor |
| [CHANGELOG.md](./CHANGELOG.md) | Histórico SemVer |
| [VERSION.md](./VERSION.md) | Snapshot da release |
| [docs/BENCHMARKS.md](./docs/BENCHMARKS.md) | Score calibrado (A+S1) |
| [docs/RELEASE_1.2.0.md](./docs/RELEASE_1.2.0.md) | Release notes 1.2.0 |
