# ADR 0004 — Geocodificação de CNPJs

## Contexto
O motor antigo usava um dicionário de ~26 bairros (D1) e só `Estabelecimentos0.zip` (D6).

## Decisão
1. Processar **todos** os `Estabelecimentos*.csv/zip` do diretório `RF_CNPJ_DIR`.
2. Filtrar situação ativa (`02`) e municípios-alvo via tabela oficial TOM→IBGE da Receita
   (https://www.gov.br/receitafederal/dados/municipios.csv/view).
3. Fallback: CEP (cache) → logradouro+número (Nominatim ≤1 req/s, User-Agent, cache) → centróide de bairro (polígono, não dicionário).
4. `geo_precisao=sem` não entra no score; `bairro` entra com `BAIRRO_GEO_WEIGHT`.

## Alternativas
- Geocoder comercial pago: possível via adapter, não nesta versão.
- Só CEP: perde precisão intramunicipal.

## Consequências
Cobertura de hexágonos com empresas deve subir ordens de grandeza acima de ~27 após ETL real.
