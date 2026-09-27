# Check-in — Espelho do banco Thiago + APIs para o Demo Day

**Data:** 2026-09-27  
**Repo lido:** https://github.com/devThiago1/ConverGeo.git (commit `da46ef5`)  
**Nosso repo:** [peuavelar/converGeo](https://github.com/peuavelar/converGeo)  
**Pedido:** implementar *apenas* o espelho do banco do Thiago para o mapa H3 com dados “atuais”; em seguida escolher API real para **Comprar** e **Abrir meu Negócio**, para validação antes do Demo Day.

Este documento é só análise. **Nada foi ligado em produção.** Precisa da sua validação nos itens do final.

---

## 1. O que o Thiago realmente tem

Não é um dump SQL versionado. É o **motor ETL + FastAPI** que *escreve* num Supabase (`schema convergeo`) e lê nas rotas que o nosso front já consome.

| Peça | No repo do Thiago | Serve para o nosso mapa? |
|------|-------------------|--------------------------|
| `GET /score` e `GET /top` | `api/main.py` | Sim — mesmo contrato JSON (`status`, `h3_index`, `breakdown`) |
| Grade H3 res 8 Salvador | `migrations/generate_hexagonos_01.py` | Sim — bbox Salvador, `convergeo.hexagonos` |
| Demografia IBGE 2022 | `ibge_demografico_02.py` | Parcial — só município **2927408** (Salvador); Lauro **não entra** |
| CNPJ Receita | `cnpj_extracao.py` | Parcial — só `Estabelecimentos0.zip` + TOM **3849** |
| POIs OSM | `04_osm_salvador.py` | Sim — Overpass (snapshot da data em que rodou) |
| Scores 3 camadas | `05` / `06` / `07` | Sim — 4 segmentos: `food_service`, `farmacia`, `vestuario`, `clinica` |
| Frontend Next | `frontend/convergeo-web` | Cópia do nosso web — **não precisamos** |
| `venv/` Windows | versionado | Ignorar |

Caminhos dos arquivos oficiais estão **hardcoded no PC do Thiago** (`C:\Users\thiag\Documents\convergeo\...`). Sem esses ficheiros ou um **dump do Postgres**, não reproduzimos o banco daqui.

O Render de produção já tenta ler **exatamente** esse desenho (`FROM convergeo.scores`). O tenant `postgres.hfgzdoppryfuufyouehi` está morto — por isso o mapa oficial some e o front cai no fallback demo.

---

## 2. Dá para usar só o espelho?

**Sim, para o modo Negócio (hexágonos + score), se o Thiago ainda tiver o Postgres populado.**  
**Não** isso sozinho deixa o site “100% com dados atuais” nos dois modos.

### O que o espelho resolve

- Heatmap H3 com células que existiram no ETL dele (Salvador, res 8).
- Clique → `/score` e ranking → `/top` com números calculados (não o seed demo).
- Encaixa no front atual **sem mudar UI**: o BFF já fala `/score` e `/top`.

### O que o espelho **não** resolve

| Lacuna | Detalhe |
|--------|---------|
| Comprar / marketplace | Não há tabela de anúncios reais no pipeline dele. Continua mock / CSV / VRSync nosso. |
| “Dados atuais” | Censo **2022**, CNPJ de **um** ZIP mensal, OSM da data do batch. Não é streaming. |
| Lauro de Freitas | Fora do bbox e do filtro IBGE/RF. |
| Segmentos do nosso seletor | Padaria, café, academia, etc. **não têm** linha em `scores`. |
| Renda | Ele grava `renda_media_est` = **média de densidade** do Excel. Nosso ADR 0003 já rejeitou isso: densidade ≠ renda. |
| Geocode de empresa | Centroide de **bairro** (mapa fixo). Não é endereço/CNEFE. |
| CNPJ incompleto | Só `Estabelecimentos0.zip` (1/10 da base). |
| Bug possível no macro | Insert grava `situacao = '02'`; o score macro filtra `situacao = 'ATIVA'`. Se o dump estiver assim, a camada de concorrência pode ter ficado vazia. |

### Drift de schema (espelho ≠ `engine/db/migrations/001_base.sql`)

| Tabela | Thiago (inferido dos scripts) | Nosso motor canónico |
|--------|-------------------------------|----------------------|
| `hexagonos` | `h3_index`, `h3_resolucao`, `geom` | + `municipio_ibge`, `pct_area_terrestre`, `lat`, `lng` |
| `demografico` | `renda_media_est` | `renda_media`, `renda_fonte`, `renda_ano_base`, densidade |
| `empresas` | `id`, `nome_fantasia`, `situacao`, `geom` | `cnpj` PK, `geo_precisao`, `municipio_ibge` |
| `osm_pois` | `id`, `tipo`, `subtipo` | `osm_id`, `categoria` |

Conclusão: o espelho deve ir para um schema **legado só-leitura** (`convergeo`), não misturar com `convergeo_engine`. A API v1 que já existe lê `convergeo.scores` — é o caminho curto do Demo Day.

---

## 3. Como espelhar (proposta, após o seu OK)

Não copiar os `.py` do Windows para o nosso `engine/`. Só o **conteúdo** das 5 tabelas.

1. Thiago gera dump (sem senha no git):

```bash
pg_dump "$DATABASE_URL" \
  --schema=convergeo \
  --data-only \
  --table=convergeo.hexagonos \
  --table=convergeo.demografico \
  --table=convergeo.empresas \
  --table=convergeo.osm_pois \
  --table=convergeo.scores \
  -Fc -f convergeo_thiago.dump
```

2. Novo projeto Supabase (tenant válido) + PostGIS.  
3. `CREATE SCHEMA convergeo` com o DDL **dele** (ou views de compatibilidade).  
4. Restore. Contagens mínimas para aceitar o dump:

   - `hexagonos` > 200  
   - `scores` com os 4 segmentos e `score_total` NOT NULL  
   - `empresas` e `osm_pois` > 0  

5. `DATABASE_URL` só no Render (e opcionalmente no BFF Vercel).  
6. Manter o fallback demo se o banco cair de novo.  
7. Banner: **“Score a partir do lote ETL Salvador (IBGE 2022 + RF + OSM)”** — não dizer “tempo real”.

**Não** versionar ZIP da Receita, Excel/GPKG do IBGE, nem a connection string.

---

## 4. APIs reais para o Demo Day

Regra já do produto: **sem scraping de portal** (GeckoAPI / OLX / ZAP HTML). Marketplace = anúncio próprio ou feed oficial do anunciante.

### 4.1 Abrir meu Negócio (hex + saturação + fluxo)

| Fonte | Tipo | O que entrega | Para Demo Day? |
|-------|------|----------------|----------------|
| **Espelho Thiago** (`convergeo.scores`) | Snapshot Postgres | Mapa H3 já pontuado | **Sim — caminho mais curto** |
| IBGE Sidra / Agregados | API oficial | Indicadores municipais/UF, não hex | Complemento de pitch, não grade |
| IBGE malha + setores 2022 | Download oficial | População/domicílios por setor → H3 | Relançar ETL nosso (mais lento) |
| IBGE CNEFE 2022 | Download oficial | Endereço georreferenciado | Melhora geocode CNPJ (depois) |
| Receita CNPJ (dados.gov.br) | ZIP mensal | Empresas ativas + CNAE + município | Relançar ETL com **todos** os `Estabelecimentos*.zip` |
| BrasilAPI `/cnpj/v1/{cnpj}` | API | 1 CNPJ por vez | Lookup, **não** malha |
| OSM Overpass + Nominatim | API (já no BFF) | POIs no clique do mapa | **Já ligado** no Comprar |
| Base dos Dados / Brasil.io | API/BigQuery | CNPJ tratado | Opcional se não quisermos ZIP |

Recomendação Negócio no Demo Day: **espelho + OSM ao vivo no clique**. Não dá para ter grade H3 “ao vivo” só com API — a malha é batch.

### 4.2 Comprar / imobiliário

| Fonte | Legal para anúncio no mapa? | Nota |
|-------|-----------------------------|------|
| **CSV / tela Anuncie** (já existe) | Sim | Inventário próprio, honesto |
| **VRSync XML** (Grupo Zap, já no motor) | Sim | Feed do **anunciante parceiro**, não scrape |
| FipeZap / índices | Índice, não listing | Bom no pitch (“R$/m² Salvador”) se baixarmos o relatório oficial |
| IPTU SEFAZ Salvador | Sem API aberta de cadastro | Portal de débito, não serve de feed |
| Vista / Kenlo / Jetimob / Imobzi | Sim, se houver contrato | API de CRM — precisa login de imobiliária parceira |
| GeckoAPI, parse de ZAP/VivaReal/OLX | **Não** (decisão 1.2.0) | Terceiros como se fossem nossos |
| MIX / Imoblist | Parceria B2B | Fora do prazo se não houver os dois lados |

Recomendação Comprar no Demo Day: **manter mocks + 1 CSV/VRSync de parceiro real se existir**, selo “anúncios próprios / demonstração”. Não ligar extrator de portal.

---

## 5. Plano em duas fases (só depois da validação)

### Fase A — Demo Day (espelho)

1. Receber dump ou URL read-only do Thiago.  
2. Restore no Supabase novo.  
3. Render aponta para esse banco.  
4. Vercel continua com BFF + fallback.  
5. Conferir `/backend/top?segmento=food_service&limit=20` ≠ demo.  
6. Hexágonos reais no Negócio; Comprar inalterado (OSM + mocks).

### Fase B — dados oficiais nossos (pós-demo ou se o dump falhar)

1. ETL do `engine/` com IBGE 2022 (Salvador **e** Lauro), renda do responsável, todos os ZIPs CNPJ, CNEFE/Nominatim.  
2. Schema `convergeo_engine`.  
3. Marketplace só por ingest oficial.

---

## 6. Validação (respondida 2026-09-27)

1. Espelho no Demo Day — **Sim**, mas **criar o banco nosso do zero**.  
2. Acesso ao Supabase do Thiago — **Não**.  
3. Limitações no pitch — **Sim**; manter diversidade de segmentos; dados oficiais depois.  
4. Comprar — **Não** (mocks + OSM).  
5. Sem scrape — **Sim**.  
6. Lauro — **Não** neste momento.

Implementação: `docs/BANCO_BOOTSTRAP.md` + `python -m convergeo_engine.cli bootstrap`.

---

## 7. Bloqueio restante (ops, não código)

- Criar projeto Supabase (PostGIS) e colar `DATABASE_URL` no Render.  
- Sem isso o motor em produção continua a cair no fallback demo da Vercel.
