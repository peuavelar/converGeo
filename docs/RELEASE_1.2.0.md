# Release 1.2.0 — ConverGeo Web

**Data:** 2026-08-11 · **Tag:** `v1.2.0` · **Package:** `1.2.0`  
**Produção:** https://convergeo-front.vercel.app  
**Repositório:** https://github.com/peuavelar/converGeo

Contexto condensado para agentes: [contexto.md](../contexto.md).

---

## Objetivo da versão

Amadurecer o frontend para um MVP mais estável em mobile e desktop: metro Salvador + Lauro, comparação A/B no Negócio, código mais enxuto, benchmarks opcionais (sem marketplace de terceiros) e UX clara ao trocar de modo.

---

## Principais entregas

### 1. Modos Comprar / Negócio

- Header com nav centralizada e tipografia menor (`ZillowTopNav`)
- Troca de modo com **overlay de loading** (`ModeTransitionOverlay`) — mapa não “pisca” como bug
- Fly da câmera: Negócio enquadra RMS; Comprar volta pitch 0

### 2. UX mapa e mobile

- Pin card bottom sheet; safe-area; um overlay por vez
- `RegionHexSheet`, tab bar, MapControls com alvos de toque maiores
- Marketplace e ficha de imóvel alinhados ao layout mobile

### 3. Comparação A/B (Negócio)

- Digitação de Região A e B + botão **Comparar locais**
- Resolve bairro/município via `lib/negocio/compareRegions.ts`
- `ViewCompare` mostra índice da região, preço/m², tags e hex scores quando a API responde
- Clique no mapa **não** define A/B nesse fluxo

### 4. Cobertura geográfica

- Salvador + **Lauro de Freitas** em `neighborhoods.ts` / `streets.ts`
- Allowlist metro em `lib/benchmarks/metro.ts`

### 5. Benchmarks externos (S1) — feature flag

- Dados externos = referência de preço **asking**, não anúncios
- `calibratedOpportunityScore` derivado (weight 0.10, ± ±6)
- Flag off por padrão — score base e Match inalterados
- Job cron + JSON em `data/benchmarks/`
- Detalhes: [BENCHMARKS.md](./BENCHMARKS.md)

### 6. Refatoração técnica

| Antes | Depois |
|-------|--------|
| `page.tsx` ~1646 linhas | ~1130 linhas |
| Lógica misturada no shell | Hooks + builders |

Módulos novos / centrais:

- `app/hooks/useNearbyPlaces.ts`
- `app/hooks/useNegocioMap.ts`
- `app/hooks/useMarketplaceScores.ts`
- `app/map/buildMapLayers.ts`
- `app/utils/dynamicScore.ts`, `compareList.ts`, `exportHexCsv.ts`, `regionLookup.ts`
- `lib/negocio/compareRegions.ts`, `fetchHexScores.ts`
- `lib/benchmarks/**`

### 7. Documentação e release

- README com badges e estrutura
- `CHANGELOG.md`, `VERSION.md`
- Tag Git `v1.2.0` + deploy Vercel com autor GitHub válido

---

## O que foi explicitamente descartado

- Integração GeckoAPI / OLX como **fonte de anúncios** do marketplace (revertida)
- Reescrita do marketplace para listar imóveis de terceiros
- Alterar Match Score ou selo “Acima do orçamento” via benchmarks

---

## Como validar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Checklist rápido:

- [ ] Trocar Comprar ↔ Negócio → aparece loading do mapa
- [ ] Negócio: digitar duas regiões e Comparar locais
- [ ] Comprar: clique no mapa → pin + POIs / card
- [ ] Mobile: overlays não empilham de forma confusa
- [ ] (Opcional) `ENABLE_EXTERNAL_BENCHMARK=true` + `npm run test:benchmarks`

---

## Variáveis relevantes

```env
DATA_PROVIDER=osm
ENABLE_EXTERNAL_BENCHMARK=false
NEXT_PUBLIC_ENABLE_EXTERNAL_BENCHMARK=false
CRON_SECRET=
OSM_USER_AGENT=ConverGeo/1.2 (https://github.com/peuavelar/converGeo)
```

---

## Deploy e operação

| Item | Valor |
|------|--------|
| Projeto Vercel | `convergeo-front` |
| Domínio | `convergeo-front.vercel.app` |
| Branch produção | `master` |
| Autor Git exigido (Hobby) | e-mail do GitHub da conta `peuavelar` (ex.: `pedro745lucas@gmail.com`) |

Commits com `convergeo@local` são **bloqueados** pela Vercel no plano Hobby.

---

## Mapa de arquivos por tema

| Tema | Caminhos |
|------|----------|
| Shell / modos | `app/page.tsx`, `ZillowTopNav`, `ModeTransitionOverlay` |
| Nearby / pin | `useNearbyPlaces`, `MapPinListingsCard`, `MapNearbyLegend` |
| Negócio A/B | `FilterPanel`, `ViewCompare`, `lib/negocio/*` |
| Camadas mapa | `app/map/buildMapLayers.ts` |
| Benchmarks | `lib/benchmarks/*`, `app/api/cron/collect-benchmarks`, `app/api/marketplace/scores` |
| Dados região | `app/data/neighborhoods.ts`, `streets.ts` |

---

## Histórico SemVer

Ver [CHANGELOG.md](../CHANGELOG.md).

- **1.0.0** — mapa + mocks Salvador  
- **1.1.0** — OSM BFF, marketplace regional, PWA  
- **1.2.0** — esta release (mobile, A/B, refator, benchmarks flag, transição de modo)
