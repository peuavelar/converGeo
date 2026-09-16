# ADR 0005 — Normalização robusta do score v2

## Contexto
Min-max puro (D7) explode com outliers.

## Decisão
Winsorizar p5–p95 e escalar 0–10. Camada ausente = `null`; pesos renormalizados; `cobertura` na resposta.

## Alternativas
- Rank percentil: mais estável ainda, menos interpretável linearmente.
- Min-max: rejeitado.

## Consequências
Scores extremos menos frágeis; comparações temporais exigem a mesma janela de winsorização.
