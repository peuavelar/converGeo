# ConverGeo Web — v1.3.1

## Release
- **Versão:** 1.3.1
- **Motor:** persistência Postgres (`convergeo_engine`), v1 lê `convergeo.scores` (`V1_SOURCE=legacy`)
- **Marketplace:** mocks por padrão; API atrás de `NEXT_PUBLIC_MARKETPLACE_SOURCE=api`

## O que mudou (1.3.1)
- Repositório real (Protocol + Postgres); MemoryStore só testes/demo
- Leitor CNPJ no layout oficial (zip latin1 `;` sem cabeçalho)
- `etl ibge-prepare`, STRtree, área geodésica
- API keys HMAC, login Supabase (`proxy.ts`, `/entrar`, `/painel`)
- Demo marcado (`"demo": true`) e direção de mercado por perfil

## Produção
- Front: Vercel — só o Next.js
- Motor: **serviço Render novo** (não substituir o legado) + `migrate` no Supabase
- Marketplace em produção: mock até flag `api`
