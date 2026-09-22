# ConverGeo Web — v1.3.2

## Release
- **Versão:** 1.3.2
- **Motor:** Render legado se estiver saudável; senão fallback demo na Vercel (`/api/negocio/*`)
- **Marketplace:** mocks por padrão

## O que mudou (1.3.2)
- `/backend/score`, `/backend/top` e `/backend/health` passam a ser servidos pela Vercel
- Tenta o Render; em 5xx/timeout usa o mesmo seed_demo do engine, com `"demo": true`
- Erros de banco do Supabase **não** vazam no JSON público

## Produção
- Front: Vercel (`convergeo-front`)
- Banco do Render (`postgres.hfgzdoppryfuufyouehi`) está inválido — fallback demo até haver URL nova
