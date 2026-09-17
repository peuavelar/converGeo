# ADR 0007 — Isolamento de schema legado

## Contexto
As tabelas de produção em `convergeo` (especialmente `scores`) alimentam o modo Negócio no Render. A v1.3.0 gerava `001_base.sql` com os mesmos nomes e colunas diferentes.

## Decisão
- Legado (somente leitura): `LEGACY_SCHEMA=convergeo`.
- Engine: `ENGINE_SCHEMA=convergeo_engine`. Migrações `000`–`004` criam só esse schema.
- `GET /score` e `/top` leem `convergeo.scores` quando `V1_SOURCE=legacy` (padrão).
- `V1_SOURCE=engine` lê `convergeo_engine.scores` depois que o ETL novo gerar paridade (fora desta versão).
- `schema_migrations` com checksum; `migrate` não reaplica e falha se o SQL já aplicado mudou.

As migrações 1.3.0 **não** foram aplicadas em produção (somente `MemoryStore` + `migrate` local). Reescrevê-las para o schema novo é seguro.

## Consequências
Dois conjuntos de tabelas coexistem. O serviço Render legado permanece até o cutover documentado no README do engine.
