# ADR 0008 — API keys (HMAC-SHA256)

## Contexto
`ENGINE_ADMIN_KEY` vazia desligava a autenticação. A chave do anunciante era gravada e nunca conferida.

## Decisão
- Hash HMAC-SHA256 com `API_KEY_PEPPER` (fallback: `ENGINE_ADMIN_KEY` em desenvolvimento).
- Comparação `hmac.compare_digest`.
- Admin cria anunciante e vê a chave **uma vez**.
- Ingestão CSV e sync de feed exigem a chave **daquele** `anunciante_id`.
- Em produção (`ENGINE_ENV=production` ou `RENDER`/`K_SERVICE`) o processo não sobe sem admin key ≥ 32 caracteres.
- Tela `/anuncie` não envia admin key; ingestão máquina-a-máquina fica no painel autenticado.

## Alternativas
Hash de senha (argon2) — mais lento para keys de API; HMAC basta com pepper de servidor.
