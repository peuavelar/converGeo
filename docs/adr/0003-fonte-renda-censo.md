# ADR 0003 — Fonte de renda

## Contexto
`renda_media_est` no motor antigo era média de densidade (D3). Densidade **não** é renda.

## Decisão
Usar o produto IBGE **Censo 2022 — Agregados por Setores Censitários: Rendimento do Responsável**:
http://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios_Rendimento_do_Responsavel/

Campo mapeado no ETL: `renda_media` (nome da coluna no CSV local configurável). Metadado: rendimento do **responsável pelo domicílio**, não renda per capita de todos os moradores (limitação documentada pelo IBGE em 28/03/2025).

Colunas gravadas: `renda_media`, `renda_fonte=censo_2022_rendimento_responsavel_setor`, `renda_ano_base=2022`.

## Alternativas
- Censo 2010 V005: **não** é renda (média de moradores). Rejeitado.
- Deflator de 2010: só se 2022 indisponível. Hoje 2022 está publicado.

## Consequências
Comparações de “riqueza” entre hexágonos devem citar que a variável é rendimento do responsável.
