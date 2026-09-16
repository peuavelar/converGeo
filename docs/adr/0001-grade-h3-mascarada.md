# ADR 0001 — Grade H3 mascarada

## Contexto
A grade anterior era um bounding box retangular (D5), gerando hexágonos no mar e fora do município.

## Decisão
Gerar células H3 resolução 8 cobrindo os polígonos da **Malha Municipal IBGE** (`CD_MUN`), filtrando `pct_area_terrestre` abaixo de limiar configurável (`MIN_LAND_AREA_FRAC`, padrão 0.15).

Códigos oficiais: Salvador `2927408`, Lauro de Freitas `2919207`
(https://www.ibge.gov.br/explica/codigos-dos-municipios.php).

## Alternativas
- Bounding box + filtro de costa por raster: mais complexo e instável.
- Resolução 9: mais células, custo de ETL maior.

## Consequências
Contagem de hexágonos deixa de ser 1.077 (pitch) até `etl grade` rodar na malha oficial. O número real vai para `engine/reports/fase1_qualidade.md`.
