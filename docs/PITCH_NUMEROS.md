# Números de pitch — origem reproduzível

| Número | Origem | Comando / fonte | Estado |
|--------|--------|-----------------|--------|
| Códigos IBGE Salvador / Lauro | 2927408 / 2919207 | https://www.ibge.gov.br/explica/codigos-dos-municipios.php | verificado |
| TOM Receita Salvador / Lauro | 3849 / 3685 | https://www.gov.br/receitafederal/dados/municipios.csv/view | verificado |
| Hexágonos H3 (pitch antigo 1.077) | **substituir** | `python -m convergeo_engine.cli etl grade` + `engine/reports/fase1_qualidade.md` | A VERIFICAR até malha oficial |
| CNPJs / hexágonos com empresas | **substituir ~27** | `python -m convergeo_engine.cli etl cnpj` | A VERIFICAR (precisa zips da Receita) |
| POIs OSM | **substituir** | `python -m convergeo_engine.cli etl osm` | A VERIFICAR (Overpass ao vivo) |
| p95 API | pitch < 800 ms | `cd engine && locust -f locustfile.py --headless -u 20 -r 5 -t 30s --host http://127.0.0.1:8000` | A VERIFICAR (sem medição nesta esteira) |
| Correlação score v2 | **não forçar** | `python -m convergeo_engine.cli scoring-validate` | insuficiente até ETL real |

Nenhum número de pitch deve ser citado em slide sem linha nesta tabela.
