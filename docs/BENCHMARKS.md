# Benchmarks de preço (referência externa → motor)

## O que isto é

Dados externos **não são anúncios**. Alimentam `price_benchmarks` (R$/m² pedido) para calibrar o Opportunity Score dos imóveis **próprios** do marketplace.

Escopo geográfico: **Salvador (BA)** + **Lauro de Freitas** (RMS). Allowlist em `lib/benchmarks/metro.ts`; recortes em `lib/benchmarks/cuts.ts`. Fallback: bairro → município → `rms-salvador`.

`priceBasis` é sempre **`"asking"`** (preço de anúncio / pedido). Há viés de alta conhecido vs preço de transação fechada — o motor não deve tratar a mediana como valor de venda realizado.

## Feature flag

```env
ENABLE_EXTERNAL_BENCHMARK=true
# opcional no client:
NEXT_PUBLIC_ENABLE_EXTERNAL_BENCHMARK=true
CRON_SECRET=um-segredo-longo
# opcional: GECKOAPI_KEY — reservada ao worker; job front usa simulação até o backend extrair
BENCHMARK_STORE_DIR=./data/benchmarks
```

Com a flag **off**, `calibratedOpportunityScore === score` base (mock). Match Score e selo “Acima do orçamento” não mudam.

## Tabelas (JSON versionado)

| Arquivo | Papel |
|---------|--------|
| `external_listing_snapshots.json` | bruto privado (sem título/imagem/vendedor) |
| `price_benchmarks.json` | agregado consumido pelo motor |
| `collection_runs.json` | auditoria do job |

“Migração”: `npm run seed:benchmarks` cria/atualiza os JSON em `data/benchmarks/`.

## Job

- Vercel Cron: segunda 08:00 UTC → `GET /api/cron/collect-benchmarks`
- Header: `Authorization: Bearer $CRON_SECRET`
- Recortes: `lib/benchmarks/cuts.ts` (Salvador amplo + Lauro de Freitas / RMS)

## Regras estatísticas

Implementadas em `lib/benchmarks/rules/` com testes (`npm run test:benchmarks`):

1. Separar venda/aluguel  
2. Deduplicar (bairro + área/5m² + preço/2%)  
3. Outliers IQR  
4. Exigir price + usableArea  
5. n ≥ 8 com fallback neighborhood → region → city  
6. Janela 90 dias (+ encalhado > 180d listedAt)  
7. `priceBasis: "asking"`

## Score (S1)

`scoring.config.ts`: peso `0.10`, ajuste máx. ±6 pontos.  
`calibratedOpportunityScore` é **derivado**; o `score` mock base permanece intacto.

Explicabilidade: `bucketKey`, `bucketLevel`, `n`, `medianPricePerM2`, `computedAt`.

## Relatório before/after

```bash
npm run seed:benchmarks
npm run compare:scores
```

## Isolamento

- Snapshots nunca sobrescrevem `MARKETPLACE_LISTINGS`
- Contador Marketplace = só imóveis próprios
- `/api/marketplace/scores` devolve só campos derivados
