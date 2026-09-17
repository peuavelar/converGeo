# ADR 0003 — Fonte de renda

## Contexto
`renda_media_est` no motor antigo era média de densidade (D3). Densidade **não** é renda.

## Decisão
Usar o produto IBGE **Censo 2022 — Agregados por Setores Censitários: Rendimento do Responsável**:
http://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios_Rendimento_do_Responsavel/

Campo mapeado no ETL via `etl/ibge_colunas.yaml` (aliases). Produto: **Censo 2022 — Agregados por Setores Censitários: Rendimento do Responsável**
http://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios_Rendimento_do_Responsavel/

Consulta ao dicionário: **2026-09-16**. O código exato da variável na publicação baixada fica **A VERIFICAR** (o YAML aceita `renda_media`, `rendimento`, `V06001` e o legado `V005` só como alias de fixture). Não usar V005 do Censo 2010 como renda.

Comando `etl ibge-prepare` junta GPKG/SHP/GeoJSON da malha de setores com CSVs de agregados e renda por `CD_SETOR` normalizado.

Colunas gravadas: `renda_media`, `renda_fonte=censo_2022_rendimento_responsavel_setor`, `renda_ano_base=2022`.

## Alternativas
- Censo 2010 V005: **não** é renda (média de moradores). Rejeitado.
- Deflator de 2010: só se 2022 indisponível. Hoje 2022 está publicado.

## Consequências
Comparações de “riqueza” entre hexágonos devem citar que a variável é rendimento do responsável.
