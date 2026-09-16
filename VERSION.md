# ConverGeo Web — v1.3.0

## Release
- **Versão:** 1.3.0
- **Motor:** `engine/` (FastAPI v1 `/score` `/top` + v2 marketplace)
- **Marketplace:** mocks por padrão; API atrás de `NEXT_PUBLIC_MARKETPLACE_SOURCE=api`

## O que mudou (1.3.0)
- ETL corrigido (máscara municipal, renda Censo 2022, CNPJs geocodificados, OSM)
- Ingestão CSV + VRSync, preço justo etapa A
- Página `/anuncie`, seletor de perfil no modo Comprar
- ADRs metodológicos em `docs/adr/`

## Produção
- Front: Vercel (`convergeo-front`)
- Motor: Render / Docker (`engine/Dockerfile`) + Supabase PostGIS
