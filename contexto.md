# Contexto — ConverGeo Web v1.2.0

> Documento de contexto para humanos e agentes de IA.  
> Versão: **1.2.0** · Repo: [peuavelar/converGeo](https://github.com/peuavelar/converGeo) · Produção: https://convergeo-front.vercel.app

---

## 1. O que é o produto

ConverGeo é um frontend Next.js de **inteligência imobiliária e geoespacial** focado em **Salvador (BA)** e **Lauro de Freitas (RMS)**.

Dois modos no header:

| Modo | ID interno | Função |
|------|------------|--------|
| **Comprar** | `imovel` | Marketplace, orçamento, regiões, rotas, POIs OSM |
| **Abrir meu Negócio** | `negocio` | Heatmap H3, Top 5, score pontual, comparação A/B |

Stack: Next.js 16 · React 19 · TypeScript · Tailwind 4 · MapLibre · Deck.gl.

---

## 2. Evolução até a 1.2.0 (resumo da sessão / branch)

### 2.1 UX mobile (mantido da fase anterior)

- Pin card como bottom sheet no mobile
- Um overlay por vez (ficha do bairro × marketplace)
- Touch targets maiores; `RegionHexSheet` + safe-area
- Tab bar mobile; `MapControls` maiores
- Arquivos: `MapPinListingsCard`, `RegionHexSheet`, `ZillowSideRail`, `MapControls`, `page.tsx`

### 2.2 GeckoAPI / OLX — descartado

- Integração de anúncios externos foi **iniciada e revertida** a pedido
- Removidos: rotas gecko, libs, zod/tsx extras ligados a isso
- Decisão: dados externos **não são anúncios** do marketplace

### 2.3 Benchmarks externos (A + S1) — opcional

- Dados externos = **benchmarks de preço** (R$/m² pedido), não listings públicos
- Score calibrado derivado: `calibratedOpportunityScore` atrás de flag
- Base `score` mock e Match Score **não são reescritos**
- Pesos aprovados: weight `0.10`, ±6 pts
- Metro: Salvador + Lauro (`lib/benchmarks/metro.ts`, `cuts.ts`)
- Flag: `ENABLE_EXTERNAL_BENCHMARK` / `NEXT_PUBLIC_ENABLE_EXTERNAL_BENCHMARK` (default `false`)
- Cron: `app/api/cron/collect-benchmarks`
- Scores derivados: `app/api/marketplace/scores`
- Docs: `docs/BENCHMARKS.md` · testes: `npm run test:benchmarks`

### 2.4 Header / Negócio

- Nav centralizada; logo geo pin (`ZillowTopNav`)
- Tipografia do header reduzida
- Accents preto/branco (branco dominante)
- Lauro de Freitas nos dados: `neighborhoods.ts`, `streets.ts`
- Fly do mapa ao trocar modo

### 2.5 Comparar locais A/B por digitação

- Não é mais por clique no mapa para definir A/B
- Inputs + **Comparar locais** → `runNegocioCompare` → `lib/negocio/compareRegions.ts`
- Resolve região completa (bairro/município); métricas locais + hex score opcional da API
- UI: `FilterPanel`, `ViewCompare`

### 2.6 Refatoração / otimização de código

- `app/page.tsx`: ~1646 → ~1130 linhas
- Hooks: `useNearbyPlaces`, `useNegocioMap` (`useMapCamera` + `useNegocioHexData`)
- Camadas: `app/map/buildMapLayers.ts`
- Helpers: `dynamicScore`, `compareList`, `exportHexCsv`, `regionLookup`
- Negócio API: `lib/negocio/fetchHexScores.ts`

### 2.7 Transição Comprar ↔ Negócio

- Overlay `ModeTransitionOverlay` no mapa (spinner + texto)
- Evita impressão de bug enquanto camadas/câmera mudam
- Nav bloqueada durante a transição
- CSS: `animate-mode-veil-in` / `out` em `globals.css`

### 2.8 Docs / release GitHub

- `package.json` → **1.2.0**
- `VERSION.md`, `CHANGELOG.md`, README redesenhado
- Tag `v1.2.0` no GitHub
- Benchmarks doc movido para `docs/BENCHMARKS.md`

### 2.9 Deploy Vercel (lições)

- Projeto: **`convergeo-front`** → https://convergeo-front.vercel.app
- Git conectado a `peuavelar/converGeo`
- **Bloqueio Hobby:** commits com autor `convergeo@local` são rejeitados
- Autor válido: `peuavelar <pedro745lucas@gmail.com>` (e-mail do GitHub)
- Ambiente Cursor pode forçar `GIT_AUTHOR_EMAIL=convergeo@local` — sobrescrever ao commitar
- Deploy de produção da 1.2.0 ficou **Ready** após commit com e-mail válido

---

## 3. Arquitetura mental (onde mexer)

```
app/page.tsx              → shell UI + orquestra modos
app/hooks/                → nearby, negócio hex/câmera, marketplace scores
app/map/buildMapLayers.ts → Deck.gl layers imóvel/negócio
app/components/zillow/    → header, filter bar, side rail
app/components/map/       → pin card, legend, mode transition
lib/negocio/              → compare A/B + fetch /score|/top
lib/benchmarks/           → coleta, regras, calibração S1
app/api/geo/              → BFF OSM (nearby, geocode, reverse)
app/data/                 → neighborhoods, streets, marketplace mocks
```

**Convenção Next.js:** este repo usa Next 16 com APIs que podem diferir do “Next clássico” — ler `node_modules/next/dist/docs/` e `AGENTS.md` antes de mudanças grandes.

---

## 4. Decisões de produto (não reverter sem pedido)

1. Marketplace = **só imóveis próprios** (mocks); externos ≠ anúncios
2. Benchmarks = calibração estatística, flag **off** por padrão
3. Comparação Negócio A/B = **digitação**, não clique no mapa
4. Clique no mapa no Negócio em modo compare = **não define** locais A/B
5. Mobile: um overlay dominante por vez
6. Transição entre modos é obrigatória para UX (não remover sem alternativa)

---

## 5. Flags e scripts úteis

```env
# .env.local
ENABLE_EXTERNAL_BENCHMARK=false
NEXT_PUBLIC_ENABLE_EXTERNAL_BENCHMARK=false
CRON_SECRET=
DATA_PROVIDER=osm
```

```bash
npm run dev
npm run build
npm run test:benchmarks
npm run seed:benchmarks
npm run compare:scores
npm run deploy          # vercel --prod
```

---

## 6. Estado atual (pós 1.2.0)

| Item | Estado |
|------|--------|
| Versão package | 1.2.0 |
| Tag Git | v1.2.0 |
| Produção Vercel | convergeo-front.vercel.app (Ready) |
| Escopo geo | Salvador + Lauro de Freitas |
| Gecko/OLX ads | Removido |
| Benchmarks | Código presente; flag default off |

---

## 7. Documentação relacionada

| Arquivo | Conteúdo |
|---------|----------|
| [docs/RELEASE_1.2.0.md](./docs/RELEASE_1.2.0.md) | Release notes detalhadas |
| [CHANGELOG.md](./CHANGELOG.md) | Histórico SemVer |
| [VERSION.md](./VERSION.md) | Snapshot da release |
| [docs/BENCHMARKS.md](./docs/BENCHMARKS.md) | Motor de benchmarks |
| [docs/DATA_ARCHITECTURE.md](./docs/DATA_ARCHITECTURE.md) | BFF + providers OSM/backend |
| [README.md](./README.md) | Visão do repositório |

---

## 8. Próximos passos naturais (não implementados)

- Limpar deploys UNKNOWN antigos no Vercel
- Garantir commits futuros com e-mail GitHub (evitar `convergeo@local`)
- Ligar benchmarks em staging e validar UI de score calibrado
- Release notes oficiais no GitHub Releases UI (tag já existe)
