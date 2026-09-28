# Motor ConverGeo

Python 3.11+ · FastAPI · H3 · shapely.

```bash
cd engine
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
pytest
# Banco local (mesmo modelo do Thiago: Postgres + PostGIS + schema convergeo)
docker compose up -d
export DATABASE_URL=postgresql://postgres:convergeo@127.0.0.1:5432/convergeo
python -m convergeo_engine.cli migrate
python -m convergeo_engine.cli bootstrap   # grade Salvador + OSM + scores dos 17 segmentos
python -m convergeo_engine.cli serve   # http://127.0.0.1:8000
```

ETL (caminhos oficiais via env, sem zips versionados):

```bash
export IBGE_MALHA_PATH=/dados/malha.geojson
export IBGE_SETORES_PATH=/dados/setores.geojson
export IBGE_RENDA_PATH=/dados/renda.csv
export RF_CNPJ_DIR=/dados/cnpj
export RF_MUNICIPIOS_CSV=/dados/municipios.csv
python -m convergeo_engine.cli etl all
```

Deploy: o BFF da Vercel lê `DATABASE_URL` (schema `convergeo`) em `/api/negocio/score` e `/top`. O motor Python no **Render** usa a mesma URI para ETL/`GET /health`. Ver `docs/BANCO_BOOTSTRAP.md`.

Contrato legado do modo Negócio: `GET /score` e `GET /top` (v1). Marketplace: `/v2/*` atrás de `NEXT_PUBLIC_MARKETPLACE_SOURCE`.
