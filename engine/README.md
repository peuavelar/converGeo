# Motor ConverGeo

Python 3.11+ · FastAPI · H3 · shapely · PostGIS.

```bash
cd engine
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
pytest
python -m convergeo_engine.cli migrate
python -m convergeo_engine.cli serve   # http://127.0.0.1:8000
```

Sem `DATABASE_URL`, a API usa memória + `seed_demo` (respostas com `"demo": true`). Com Postgres, o seed **não** roda.

## ETL (caminhos oficiais via env, sem zips versionados)

```bash
export IBGE_MALHA_PATH=/dados/malha.geojson
export IBGE_SETORES_GPKG=/dados/setores.gpkg
export IBGE_AGREGADOS_PATH=/dados/agregados.csv
export IBGE_RENDA_PATH=/dados/renda.csv
export IBGE_SETORES_PATH=/dados/setores_preparados.geojson
export RF_CNPJ_DIR=/dados/cnpj
export RF_MUNICIPIOS_CSV=/dados/municipios.csv
python -m convergeo_engine.cli etl ibge-prepare
python -m convergeo_engine.cli etl all
```

CNPJs: zips oficiais da Receita (latin1, `;`, sem cabeçalho). IBGE: `ibge-prepare` junta malha + agregados + renda.

## Runbook de deploy (cutover sem derrubar o legado)

1. Criar um **serviço novo** no Render para este engine (não substituir o Web Service atual).
2. Apontar `DATABASE_URL` do Supabase; `ENGINE_ENV=production`; `ENGINE_ADMIN_KEY` ≥ 32 caracteres; `V1_SOURCE=legacy`.
3. Rodar `python -m convergeo_engine.cli migrate` (cria só `convergeo_engine.*`; não altera `convergeo.*`).
4. Validar `GET /score` e `/top` contra o backend atual (mesmo contrato). Script sugerido: N coordenadas do mapa, comparar `status`, `h3_index`, `score_total`.
5. Só então apontar `BACKEND_ORIGIN` da Vercel para o serviço novo.
6. Rollback: reverter `BACKEND_ORIGIN` para o Render legado. Tabelas `convergeo_engine` podem permanecer.

## Testes de integração

```bash
docker compose -f docker-compose.test.yml up -d
export DATABASE_URL=postgresql://convergeo:test@127.0.0.1:55432/convergeo_test
pytest -m integration
```

Health: `GET /health` (repositório, migrações, contagens — sem URL).
Contrato legado: `GET /score` e `GET /top`. Marketplace: `/v2/*`.
