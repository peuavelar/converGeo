# Comparação Opportunity Score — flag OFF vs ON

Gerado por `npm run compare:scores` após `npm run seed:benchmarks`.

Peso: `EXTERNAL_PRICE_WEIGHT = 0.10`, ajuste máx. ±6 pts (`scoring.config.ts`).

| Métrica | Valor |
|---------|-------|
| Imóveis | 16 |
| Com benchmark | 16 |
| Δ médio | 0.0 |
| \|Δ\| máximo | 1 |

Comportamento: **não absurdo** — calibração conservadora; Match Score intacto.

| id | base | calibrated | Δ | percentil | nível | n |
|----|------|------------|---|-----------|-------|---|
| mkt-pituba-1 | 78 | 78 | 0 | 45.1 | neighborhood | 15 |
| mkt-pituba-2 | 82 | 82 | 0 | 35.4 | neighborhood | 12 |
| mkt-barra-1 | 74 | 74 | 0 | 28.9 | neighborhood | 12 |
| mkt-barra-2 | 71 | 70 | -1 | 100 | city | 94 |
| mkt-imibui-1 | 86 | 86 | 0 | 62.8 | neighborhood | 12 |
| mkt-imibui-2 | 84 | 84 | 0 | 35.8 | neighborhood | 15 |
| mkt-paralela-1 | 91 | 91 | 0 | 35.7 | neighborhood | 12 |
| mkt-paralela-2 | 91 | 91 | 0 | 51.6 | neighborhood | 14 |
| mkt-itapua-1 | 72 | 72 | 0 | 71.8 | neighborhood | 12 |
| mkt-itapua-2 | 70 | 70 | 0 | 71.8 | neighborhood | 12 |
| mkt-horto-1 | 76 | 76 | 0 | 53.4 | neighborhood | 15 |
| mkt-itaigara-1 | 80 | 80 | 0 | 25.4 | neighborhood | 15 |
| mkt-rv-1 | 73 | 73 | 0 | 53.3 | neighborhood | 15 |
| mkt-cda-1 | 81 | 81 | 0 | 42.5 | neighborhood | 12 |
| mkt-stella-1 | 75 | 76 | +1 | 0 | neighborhood | 11 |
| mkt-pat-1 | 79 | 79 | 0 | 40.4 | neighborhood | 15 |

Para ligar na UI: `ENABLE_EXTERNAL_BENCHMARK=true` e `NEXT_PUBLIC_ENABLE_EXTERNAL_BENCHMARK=true`.
