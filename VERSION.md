# ConverGeo Web — v1.3.3

## Release
- **Versão:** 1.3.3
- **Data:** 2026-09-28
- **Motor vivo:** BFF Vercel `/api/negocio/*` → Postgres `convergeo` (Session pooler) → PostgREST → Render → demo
- **Score Negócio:** OSM-only (camada comportamental), 17 segmentos, grade bbox Salvador res 8
- **Marketplace:** mocks (`NEXT_PUBLIC_MARKETPLACE_SOURCE=mock`)

## O que esta versão consolida
- Banco nosso (schema `convergeo` + PostGIS), bootstrap bbox + OSM + scores
- Heatmap `PolygonLayer` + h3-js, mapa escuro, recorte visual de até 160 hexes
- PWA `convergeo-v1.3.3` (network-first; sem cache de `/api` e `/backend`)
- Tutorial de extração (segmento → Raio-X → CSV)
- `contexto.md` com o pé atual do projeto

## Produção
- Front: Vercel (`convergeo-front`)
- Tenant Render antigo (`postgres.hfgzdoppryfuufyouehi`) inválido — não usar
- IBGE/CNPJ: código no motor, tabelas vazias no banco

## Fora desta release (PRs encerrados, commits no GitHub)
- PR #1 Sino Analytics (`cursor/sino-analytics-chat-flow-aa24`) — experimento de chat/métricas
- PR #3 login/painéis Supabase (`cursor/convergeo-v131-engine-aa24`) — persistência/auth alternativas, não mescladas
