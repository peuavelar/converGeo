# ADR 0010 — Autenticação e papéis

## Contexto
O marketplace precisa de login sem expor API keys na página pública. O projeto já usa Supabase.

## Decisão
- Identidade: **Supabase Auth**. Front usa `@supabase/ssr`. Next.js 16 usa `proxy.ts` (não `middleware.ts`).
- Engine valida JWT (JWKS do projeto, `exp`, `aud`) e lê o papel em `convergeo_engine.perfis_usuario`. Papel do cliente é ignorado.
- API keys de anunciante permanecem só para feed/cron.
- Papéis: `admin`, `imobiliaria`, `corretor`, `proprietario`, `incorporadora`, `comprador`, `pendente`.
- Cadastro público: `comprador` ou `proprietario`. Imobiliária/corretor/incorporadora entram `pendente` até o admin.
- Mapa, score e listagem pública continuam sem login.
- Seed de usuários: `engine/scripts/seed_usuarios_dev.py` recusa produção e URLs listadas em `SUPABASE_PRODUCTION_URLS`.

## Alternativas
Auth próprio no FastAPI — duplicaria o que o Supabase já faz no front.
