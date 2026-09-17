# ADR 0009 — Direção da camada mercado

## Contexto
R$/m² alto virava nota alta para todos os perfis. Para o investidor isso mistura “bairro caro” com “oportunidade”.

## Decisão
Cada camada em `perfis.yaml` tem `direcao: positiva|negativa`.
- `moradia` / `incorporadora`: mercado **positiva** (preço/m² alto = valorização).
- `investidor`: mercado **negativa** — menor R$/m² (desconto relativo na distribuição atual) recebe nota maior.

Não há série temporal de preço nesta versão; variação no tempo fica **fora de escopo** até existir `imovel_eventos` com densidade suficiente.

Métrica futura (não implementada): desconto vs mediana do k-ring 1. Exigiria a mesma agregação `precos_hex` já calculada.
