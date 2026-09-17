# ADR 0004 — Geocodificação de CNPJs

## Contexto
O motor antigo usava um dicionário de ~26 bairros (D1) e só `Estabelecimentos0.zip` (D6).

## Decisão
1. Processar **todos** os `Estabelecimentos*.zip` (e CSV extraído) do diretório `RF_CNPJ_DIR`.
2. Layout oficial: zip → CSV **sem cabeçalho**, `sep=';'`, `encoding=latin1`. Colunas em `ESTABELECIMENTO_COLS` (consulta 2026-09-16 ao dicionário CNPJ aberto).
3. CNPJ = `cnpj_basico` (8) + `cnpj_ordem` (4) + `cnpj_dv` (2).
4. Filtrar situação ativa (`02`) e municípios-alvo via tabela oficial TOM→IBGE.
   Salvador TOM 3849 → IBGE 2927408; Lauro 3685 → 2919207 (falha se a tabela não bater).
5. Fallback: CEP (arquivo local opcional + Nominatim) → logradouro (Nominatim ≤1 req/s) → centróide de **polígono** de bairro.
6. Caches `geo_cache_cep` / `geo_cache_endereco` persistem acerto e `nao_encontrado`.
7. `GEO_PROVIDERS` ordena adapters (`cep_file`, `nominatim`, `bairro_poly`). Cobertura por provedor: **A VERIFICAR** após ETL real (anexar histograma `geo_precisao` ao relatório).

Fonte layout: https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos/receitafederal/cadastro-nacional-da-pessoa-juridica-cnpj


## Alternativas
- Geocoder comercial pago: possível via adapter, não nesta versão.
- Só CEP: perde precisão intramunicipal.

## Consequências
Cobertura de hexágonos com empresas deve subir ordens de grandeza acima de ~27 após ETL real.
