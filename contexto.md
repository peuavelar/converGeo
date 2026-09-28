# Contexto técnico — ConverGeo (fonte para PD&I)

> Documento de contexto para redigir **PD&I** (Pesquisa, Desenvolvimento e Inovação — Lei do Bem, FINEP, EMBRAPII ou equivalente).  
> Não é o relatório de PD&I. É o **inventário honesto** do que o código e a produção fazem hoje.  
> Versão do produto: **1.3.2** (`package.json`) · repo [peuavelar/converGeo](https://github.com/peuavelar/converGeo) · app: https://convergeo-front.vercel.app  
> Data de corte deste arquivo: **2026-09-28**.

**Regra de ouro para o PD&I:** o que está **implementado e testado** no repositório não é automaticamente o que está **em produção**. Camadas IBGE e Receita Federal existem no motor; o Demo Day e o heatmap vivo usam **só OSM**, com pesos renormalizados.

---

## 1. Identificação do projeto

| Campo | Valor no código / operação |
|--------|----------------------------|
| Nome | ConverGeo |
| Objeto | Inteligência geoespacial para **localização de negócio** (heatmap H3 por segmento CNAE) e **inteligência imobiliária** (marketplace próprio) em Salvador e, no desenho do motor, Lauro de Freitas (RMS/BA) |
| Recorte vivo (produção) | Salvador (BA), grade H3 resolução **8**, fonte de malha **`bbox_salvador`** (não malha municipal IBGE) |
| Software | Front Next.js 16 + React 19 + MapLibre + Deck.gl; motor Python 3.11+ FastAPI em `engine/` |
| Persistência | Postgres + PostGIS, schema **`convergeo`** (Supabase) |
| Entrega web | Vercel (`convergeo-front`) · BFF `/api/negocio/*` |
| Licença | privada (README) |
| Autor de commits | `peuavelar <pedro745lucas@gmail.com>` |

Dois modos no header (`app/page.tsx`):

| Modo | ID interno | Função no produto |
|------|------------|-------------------|
| **Comprar** | `imovel` | Marketplace de imóveis **próprios** (mocks por padrão), orçamento, regiões, rotas, POIs OSM ao vivo |
| **Abrir meu Negócio** | `negocio` | Heatmap H3, Top 5, clique pontual, CSV da matriz, comparação A/B por **digitação** |

---

## 2. Problema que o PD&I deve declarar

Empreendedor e corretor em Salvador escolhem ponto de loja ou imóvel com:

- planilhas e “feeling” de bairro;
- anúncios de portais (que **este produto não raspa**);
- dados oficiais (Censo, CNPJ, malha) **não fundidos** numa grade intramunicipal comparável por CNAE.

O estado da arte típico (GIS desktop, painéis de densidade, heatmaps genéricos, “índice de potencial” sem metodologia auditável) falha em:

1. **Unidade espacial instável** — setor censitário, bairro administrativo e CEP não coincidem; centroidação de setor no hexágono distorce população (defeito D4, corrigido no ADR 0002).
2. **Proxy errado de renda** — usar densidade populacional como “renda” (defeito D3, rejeitado no ADR 0003).
3. **Cobertura empresarial incompleta** — um único ZIP da Receita + dicionário de ~26 bairros (defeitos D1/D6, ADR 0004).
4. **Grade no mar** — bbox retangular sem máscara de terra (defeito D5, ADR 0001).
5. **Score frágil a outlier** — min-max puro (defeito D7, ADR 0005).
6. **Marketplace misturado com scrape** — anúncio de terceiro tratado como oferta própria (política do produto: **proibido**).

O artefato de P&D é um **motor de fusão espacial** (H3 res 8 × CNAE × camadas oficiais/OSM) com contrato de API estável (`GET /score`, `GET /top`) e rastreio de cobertura por camada.

---

## 3. O que é inovador (e o que não é)

### 3.1 Contribuição técnica a reivindicar

- Grade **H3 resolução 8** mascarada por polígono municipal IBGE (`CD_MUN`) com `pct_area_terrestre` e limiar `MIN_LAND_AREA_FRAC` (padrão 0,15) — `engine/convergeo_engine/etl/grade.py`, ADR 0001.
- **Rateio por área** setor censitário × hexágono (não centróide) — `etl/ibge.py`, ADR 0002.
- Renda = **Censo 2022 rendimento do responsável pelo domicílio**, nunca densidade — ADR 0003.
- CNPJ: **todos** os `Estabelecimentos*.zip`, situação ativa `02`, TOM Receita → IBGE, geocode CEP → endereço Nominatim (≤1 req/s) → centróide de bairro com peso `BAIRRO_GEO_WEIGHT`; `geo_precisao=sem` fora do score — ADR 0004.
- Score com **camada ausente = null**, pesos **renormalizados**, campo de cobertura — `scoring.combine`, ADR 0005.
- **17 segmentos** alinhados a prefixos CNAE e categorias OSM (`segments.py` + `app/data/segments.ts`).
- Separação **marketplace próprio** vs **benchmark de preço pedido** (asking), flag off, sem scraping de portal — ADR 0006 + `docs/BENCHMARKS.md`.
- BFF serverless que lê PostGIS (`pg` + Session pooler) ou PostgREST `public.scores`, com fallback Render e seed demo — `lib/negocio/engineProxy.ts`.

### 3.2 Não reivindicar como invenção

- Hexágonos H3 (Uber), MapLibre, Deck.gl, Overpass, Nominatim, PostGIS, Next.js, FastAPI.
- Os conjuntos **IBGE** e **Receita Federal** — são dados públicos; a inovação é o **método de fusão e o tratamento de ausência**.
- Contagem “1.077 hexágonos” como malha oficial — é **bbox** de Salvador (`fonte=bbox_salvador`), até `etl grade` na malha IBGE.

### 3.3 Estado da arte interno superado (motor Thiago)

O check-in `docs/CHECKIN_ESPELHO_THIAGO.md` documenta um motor paralelo (repo `devThiago1/ConverGeo`). Diferenças metodológicas **já decididas** neste repositório:

| Tema | Espelho Thiago | ConverGeo canónico |
|------|----------------|--------------------|
| Segmentos | 4 (`food_service`, `farmacia`, `vestuario`, `clinica`) | 17 |
| Renda | `renda_media_est` = média de densidade | `renda_media` Censo 2022 (ADR 0003) |
| CNPJ | só `Estabelecimentos0.zip` + TOM 3849 | todos os ZIPs + mapa TOM oficial |
| Geocode | centróide de bairro (dicionário) | CEP → endereço → bairro ponderado |
| Grade | bbox Salvador | bbox hoje; malha IBGE no ETL `grade` |
| Lauro de Freitas | fora | códigos oficiais no settings; ETL quando houver malha |

Não copiar os `.py` do Windows. Não versionar dump, ZIP da Receita nem GPKG/Excel do IBGE.

---

## 4. P&D versus produção (matriz obrigatória no PD&I)

| Módulo | No repositório | Em produção (Vercel + schema `convergeo`) | TRL sugerido |
|--------|----------------|-------------------------------------------|--------------|
| UI mapa dual-mode, PWA, modo escuro | sim | sim | 7 (demonstração em ambiente operacional) |
| BFF `/api/negocio` postgres → rest → Render → demo | sim | sim (quando `DATABASE_URL` ou chaves PostgREST) | 6–7 |
| Grade H3 bbox Salvador res 8 | sim (`etl/bbox_grade.py`, seed ~1077) | sim, `fonte=bbox_salvador` | 6 |
| Score v1 **só OSM** (camada comportamental, pesos renormalizados) | sim (`scoring/v1_negocio.py`) | sim, `fonte=osm_comportamental` | 6 |
| 17 segmentos CNAE | sim | sim (17 × 1077 = **18309** linhas em `scores`) | 6 |
| POIs OSM (Overpass batch no bootstrap) | sim | sim (tabela `osm_pois`; mapa Comprar também consulta Overpass ao vivo) | 6 |
| Máscara malha municipal IBGE | código + testes | **não** (falta `IBGE_MALHA_PATH` e zip oficial) | 4–5 (validação em laboratório) |
| Rateio Censo + renda 2022 | código + testes | tabelas `demografico` **vazias** | 4–5 |
| CNPJ geocodificado | código + testes | tabela `empresas` **vazia** | 4–5 |
| Score v1 3 camadas (0,35 / 0,40 / 0,25) | fórmula no código | **não**: estrutural e macro = `null`; total = comportamental renormalizado | 5 (especificação) / 4 (dado real) |
| Score imobiliário v2 (perfis moradia/investidor/incorporadora) | `scoring/compute.py` + `/v2/*` | marketplace **mock**; v2 não é o heatmap Negócio | 4–5 |
| Preço justo / VRSync / `/anuncie` | sim | flag `NEXT_PUBLIC_MARKETPLACE_SOURCE=mock` | 4–5 |
| Benchmarks externos (S1) | sim, flag **off** | off (`ENABLE_EXTERNAL_BENCHMARK=false`) | 3–4 |
| Hedônico | `enable_hedonic: false` | desligado | 2–3 |
| LLM `/v2/explicar` | opcional, fallback template | não é o fluxo Negócio | 3 |
| Lauro de Freitas no heatmap | códigos `2919207` / TOM 3685 | **fora** do bbox Demo Day | 4 (spec) |

**TRL** aqui é autoavaliação de engenharia para o redator do PD&I, não certificado INMETRO/MCTI. Ajustar se o edital exigir evidência (logs ETL, medições locust, parecer de usuário).

---

## 5. Arquitetura

```
Browser (MapLibre + Deck.gl PolygonLayer + h3-js res 8)
    │  modo imóvel: /api/geo/* (OSM)
    │  modo negócio: /api/negocio/score|top|health
    ▼
BFF Next.js (Vercel, runtime nodejs, Cache-Control: no-store)
    1. Postgres schema convergeo   (DATABASE_URL Session pooler)
    2. PostgREST public.scores     (SUPABASE_URL + chave publishable)
    3. FastAPI remoto              (BACKEND_ORIGIN / Render)
    4. seed_demo                   (header demo: true)
    ▼
Motor Python engine/ (FastAPI v1 + v2)
    ETL: bbox | malha IBGE | setores | renda | CNPJ | OSM
    Store: memória (dev) ou Postgres PostGIS
```

Rewrite Next: `/backend/score|top|health` → `/api/negocio/*` (`next.config.ts`).

PWA `public/sw.js` cache **`convergeo-v1.3.3`**: network-first para navegação e `/_next/`; **nunca** cacheia `/api/` nem `/backend/`.

Mapa Negócio: até **160** hexágonos no recorte visual da península (`keepHeatmapHexes` + `inSalvadorPitchFrame` em `lib/negocio/hexStyle.ts`). Isso é **recorte de UI**, não o universo estatístico da tabela (1077 células).

---

## 6. Metodologia do score (para a seção “método”)

### 6.1 Score v1 — modo Negócio (contrato do front)

Pesos nominais (`PESOS_V1` em `engine/convergeo_engine/segments.py`):

| Camada | Peso | Fonte prevista | Produção atual |
|--------|------|----------------|----------------|
| estrutural | 0,35 | IBGE Censo (população, domicílios, renda do responsável) | `null` |
| macroeconomico | 0,40 | CNPJ ativo geocodificado × prefixo CNAE do segmento | `null` |
| comportamental | 0,25 | Contagem de POIs OSM do segmento, min-max 0–10 **sem** winsorize | **única camada viva** |

Função `combine`: soma só camadas não-nulas e **renormaliza** os pesos. Com OSM-only, `score_total` ≈ `score_comportamental`. Escala OSM: min-max no conjunto do segmento; se todos iguais, nota 5,0 (POIs esparsos — p95 seria zero).

Contrato JSON (inalterado para o front):

- `GET /score?lat=&lng=&segmento=`
- `GET /top?segmento=&limit=`
- sucesso: `status: "sucesso"`, `h3_index`, `breakdown.{estrutural,macroeconomico,comportamental}`

Segmentos (id interno → rótulo → CNAE de referência no front):

| id | rótulo | CNAE UI | Prefixos ETL (macro) |
|----|--------|---------|----------------------|
| food_service | Restaurantes | 56.11-2 | 5611, 5620 |
| padaria | Padaria e confeitaria | 10.91-1 | 1091, 4721 |
| cafe | Café e lanchonete | 56.11-2/02 | 5611 |
| farmacia | Farmácia e drogaria | 47.71-7 | 4771 |
| clinica | Clínica médica | 86.30-5 | 8630, 8610 |
| otica | Ótica | 47.74-1 | 4774 |
| academia | Academia e fitness | 93.13-1 | 9313 |
| beleza | Salão de beleza | 96.02-5 | 9602 |
| vestuario | Vestuário e moda | 47.81-4 | 4781, 4782 |
| supermercado | Supermercado e minimercado | 47.11-3 | 4711, 4712 |
| pet | Pet shop | 47.89-0/04 | 4789 |
| papelaria | Papelaria e livros | 47.61-0 | 4761 |
| construcao | Material de construção | 47.44-0 | 4744, 4741 |
| posto | Posto de combustível | 47.31-8 | 4731 |
| hotel | Hotelaria | 55.10-8 | 5510 |
| educacao | Educação e cursos | 85.99-6 | 8599, 8511, 8512, 8520 |
| imobiliaria | Imobiliária | 68.21-8 | 6821, 6810 |

OSM por segmento: `OSM_POR_SEGMENTO` em `segments.py` (ex.: food_service → restaurant, cafe, fast_food, bar).

### 6.2 Score v2 — imobiliário (não é o heatmap Negócio)

Camadas: estrutural (renda + 0,01×população), macroeconômica (empresas no k-ring 1, famílias CNAE 2 dígitos), acessibilidade (contagem OSM), mercado (mediana R$/m² do hex). Winsorize p5–p95, escala 0–10.

Perfis (`scoring/perfis.yaml`):

| Perfil | estrutural | macro | acessibilidade | mercado |
|--------|------------|-------|----------------|---------|
| moradia | 0,30 | 0,25 | 0,30 | 0,15 |
| investidor | 0,20 | 0,20 | 0,20 | 0,40 |
| incorporadora | 0,25 | 0,20 | 0,15 | 0,40 |

Preço justo: mediana m² × área; faixas default ±8%; confiança cresce com n (teto n=30) e cai no fallback hexágono → k-ring → bairro → município.

### 6.3 Calibração S1 (benchmarks)

Peso 0,10, ajuste máximo ±6 pontos sobre opportunity score de **imóvel próprio**. `priceBasis = "asking"` (viés de alta vs transação). Flag **off**. Não misturar com anúncio de portal na UI.

---

## 7. Fontes de dados — base legal e licença (seção “insumos”)

Usar só o que o código aponta. **Não inventar códigos oficiais.**

| Insumo | Uso | URL / origem no código | Em produção? | Observação PD&I |
|--------|-----|------------------------|--------------|-----------------|
| Códigos município IBGE | Salvador `2927408`, Lauro `2919207` | https://www.ibge.gov.br/explica/codigos-dos-municipios.php | códigos sim; malha não | Verificado |
| TOM Receita | Salvador `3849`, Lauro `3685` | https://www.gov.br/receitafederal/dados/municipios.csv/view | mapa no ETL; tabela `municipios_rf` se ETL rodar | Verificado |
| Malha municipal IBGE | polígonos `CD_MUN` | geociências IBGE (ADR 0001) | não | zip **não** vai para o git; path `IBGE_MALHA_PATH` |
| Setores + agregados Censo 2022 rendimento do responsável | estrutural | ftp IBGE citado no ADR 0003 e `etl/ibge.py` | não | variável = rendimento do **responsável**, não per capita (nota IBGE 28/03/2025 no ADR) |
| Base CNPJ aberta RF | macro | dados.gov / layout estabelecimentos | não | todos os `Estabelecimentos*`; situação `02` |
| OpenStreetMap | comportamental + POIs do mapa | Overpass, Nominatim; ODbL | **sim** | User-Agent `ConverGeo/1.3`; Nominatim ≤1 req/s |
| Imóveis marketplace | v2 | CSV / VRSync do anunciante | mock | PF: documento/telefone fora da API pública (ADR 0006) |

**Proibido no produto e no PD&I como prática do software:** scraping de OLX/Gecko/portais; tratar listing de terceiro como anúncio ConverGeo.

---

## 8. Banco e volumes (o que se pode citar)

Schema `convergeo` (DDL: `engine/db/migrations/001_base.sql`, `engine/db/supabase_init.sql`):

- `hexagonos` — PK `h3_index`, `municipio_ibge`, `pct_area_terrestre`, lat/lng, geom, `fonte`
- `demografico` — renda com `renda_fonte` e `renda_ano_base`
- `empresas` — PK `cnpj`, `geo_precisao` ∈ {cep, endereco, bairro, sem}
- `osm_pois` — PK `osm_id`, `categoria`
- `scores` — PK (`h3_index`, `segmento`), três camadas + total + `fonte`
- marketplace: `anunciantes`, `imoveis`, `precos_hex`, … (`002_marketplace.sql`, `003_scores_imobiliario.sql`)
- views `public.scores` e `public.hexagonos` para PostgREST (`005_public_scores_api.sql`)

Volumes documentados no bootstrap (projeto Supabase operacional, **não** o tenant morto `postgres.hfgzdoppryfuufyouehi`):

| Tabela | Ordem de grandeza | Fonte |
|--------|-------------------|--------|
| `hexagonos` | ~1077 | bbox Salvador res 8 |
| `scores` | 18309 | 1077 × 17 segmentos |
| `demografico` / `empresas` | 0 | ETL oficial pendente |

Contagem de POIs OSM **não** está fixada em `docs/PITCH_NUMEROS.md` (marcada A VERIFICAR até Overpass do lote). Não colocar número de POIs no PD&I sem consultar `convergeo.osm_pois` no dia da redação.

Bbox técnico (`etl/bbox_grade.py`): lat −13,0108 … −12,7442; lng −38,5762 … −38,2891. `pct_area_terrestre` nesta fonte é interseção com o **retângulo**, não com o litoral oficial.

---

## 9. Números de pitch — o que o PD&I pode copiar

Fonte: `docs/PITCH_NUMEROS.md`. Nada entra em slide ou relatório sem linha nesta tabela.

| Número | Estado |
|--------|--------|
| IBGE 2927408 / 2919207 | verificado |
| TOM 3849 / 3685 | verificado |
| 1.077 hexágonos como malha oficial | **não**; substituir após `etl grade` |
| ~27 hexágonos com empresa (pitch antigo) | **não**; após ETL CNPJ deve subir ordens de grandeza |
| p95 API < 800 ms | **A VERIFICAR** (`engine/locustfile.py`, sem medição nesta esteira) |
| Correlação score v2 | **não forçar** até `scoring validate` com ETL real |

---

## 10. Restrições de produto (não reverter no texto do PD&I)

1. Marketplace = imóveis próprios; `NEXT_PUBLIC_MARKETPLACE_SOURCE=mock` até validar API.
2. Benchmarks = calibração estatística, **off**.
3. Comparação Negócio A/B = digitação; clique no mapa **não** define A/B.
4. Mobile: um overlay dominante por vez; transição Comprar ↔ Negócio obrigatória.
5. Motor canónico = FastAPI em `engine/` (não Java).
6. Sem source maps no front de produção; cron Vercel exige `CRON_SECRET`.
7. Segredos (`DATABASE_URL`, chaves Supabase, senhas) **nunca** no git; URI Session (`:5432`), não Transaction (`:6543`); senha percent-encoded.
8. Zips IBGE/Receita **fora** do repositório.
9. Next.js 16: ler `node_modules/next/dist/docs/` e `AGENTS.md` antes de APIs novas.
10. Python: tipos + Pydantic v2 + pytest; TypeScript: sem `any` novo.

---

## 11. Riscos científicos e limitações (seção “honestidade”)

- OSM é **volunteered geographic information**: viés de cobertura (bairros ricos mapeados demais; periferia de menos). Score comportamental replica esse viés.
- Min-max OSM sem winsorize: um hexágono com muitos POIs comprime os demais.
- Bbox inclui mar/baía residual; o mapa **corta visualmente** a península (160 hexes), o banco não.
- Censo 2022 renda do responsável ≠ renda per capita ≠ poder de compra do frequentador da loja.
- CNPJ geocodificado por Nominatim tem erro intramunicipal; `geo_precisao=bairro` entra com peso 0,4.
- Score **não** é previsão de faturamento nem recomendação de crédito.
- LGPD: base legal de anunciante PF = consentimento no Anuncie (**A VERIFICAR com jurídico**, ADR 0006).
- Correlação/validação estatística do v2: insuficiente até ETL real.
- Tenant Postgres antigo do Render está inválido; produção depende do BFF + Supabase atual.

---

## 12. Atividades de PD&I já executadas (evidência no git)

Útil para cronograma retrospectivo:

1. Especificação e ADRs 0001–0006 (`docs/adr/`).
2. Motor Python com ETL, testes (`engine/tests/`, `npm run engine:test`).
3. Substituição da API Java (`reference-api/` removida na 1.3.0).
4. Prototipação da fusão OSM-only em grade bbox (bootstrap idempotente).
5. Integração operacional Vercel ↔ PostGIS (pooler, SSL, views PostgREST).
6. UX de extração (segmento → Raio-X → CSV) — `docs/TUTORIAL_EXTRACAO.md`.
7. Isolamento de scrape e de benchmarks.

**Próximas atividades de P&D (ainda não feitas):** `etl all` com malha + setores + renda 2022 + CNPJ completo; `scoring validate`; locust em ambiente estável; inclusão de Lauro; ligar marketplace `api` com LGPD revisada; eventual calibração S1 com n≥8.

---

## 13. Mapa do repositório (onde o redator prova a afirmação)

```
app/page.tsx                 shell UI, modos
app/api/negocio/             BFF score / top / health
app/api/geo/                 Overpass / Nominatim
app/map/buildMapLayers.ts    Deck.gl
app/data/segments.ts         17 segmentos UI
lib/negocio/                 fetch, pg, rest, demo, hexStyle, compare A/B
lib/benchmarks/              S1 (flag off)
engine/convergeo_engine/
  etl/                       bbox, grade, ibge, cnpj, osm
  scoring/                   v1_negocio, compute v2, combine, perfis.yaml
  api/                       v1 contrato legado, v2 marketplace
  segments.py                OSM × CNAE × pesos
engine/db/migrations/        DDL PostGIS
docs/adr/                    decisões metodológicas
docs/PITCH_NUMEROS.md        números citáveis
docs/BANCO_BOOTSTRAP.md      como o banco foi levantado
docs/CHECKIN_ESPELHO_THIAGO.md  o que não copiar
docs/DATA_ARCHITECTURE.md    BFF + contratos
docs/BENCHMARKS.md           asking price, não anúncio
```

Scripts: `npm run test:benchmarks` · `npm run engine:test` · `python -m convergeo_engine.cli bootstrap|etl|scoring`.

---

## 14. Glossário curto para o PD&I

| Termo | Significado neste projeto |
|-------|---------------------------|
| H3 res 8 | célula hexagonal ~0,7 km² (ordem de grandeza Uber H3); unidade de análise intramunicipal |
| BFF | Backend-for-frontend na Vercel; o browser não fala SQL |
| OSM-only | produção atual do score Negócio |
| Renormalização | redistribuição dos pesos entre camadas presentes |
| Asking | preço pedido de anúncio, não transação |
| `bbox_salvador` | grade sem malha oficial |
| Seed demo | números sintéticos se postgres/rest/Render falharem |

---

## 15. Como gerar o arquivo PD&I a partir daqui

1. **Objeto e problema** — copiar seção 2; citar Salvador/RMS e a decisão de não scrape.
2. **Estado da arte** — seção 3 + ADRs (cada ADR = uma “alternativa rejeitada”).
3. **Metodologia** — seção 6 + fórmulas `combine` / winsorize; anexar `segments.py` e `perfis.yaml` como apêndice.
4. **Insumos e conformidade** — seção 7 + ADR 0006.
5. **Resultados experimentais** — só o que tiver evidência: testes pytest, volumes 1077/18309, prints do mapa OSM-only. Separar “protótipo operacional” de “ensaio de laboratório (IBGE/RF)”.
6. **TRL** — tabela da seção 4, com a ressalva de autoavaliação.
7. **Cronograma futuro** — seção 12 “próximas atividades”; não datar em semanas no relatório se o edital pedir marcos técnicos.
8. **Não escrever** que o produto “já cruza IBGE + Receita em produção”. Escrever: *o motor implementa a fusão; a instância em produção opera a camada OSM até o lote oficial.*

Código IBGE e TOM da Receita citados aqui foram conferidos nas URLs oficiais das linhas da tabela da seção 7. Qualquer outro código municipal, CNAE completo ou estatística de correlação deve ser marcado **A VERIFICAR** até o ETL correspondente.
