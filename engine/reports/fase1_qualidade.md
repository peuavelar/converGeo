# Fase 1 — qualidade

Gerado a partir das **fixtures de teste** (não é a malha IBGE completa).

Rode `python -m convergeo_engine.cli etl all` com caminhos oficiais para números reais.

- Hexágonos mascarados (fixture): ver `pytest engine/tests/test_etl.py`
- Códigos IBGE: 2927408 / 2919207 (fonte IBGE)
- TOM Receita: 3849 / 3685 (fonte Receita)

O número 1.077 do pitch **não** deve ser reutilizado até o ETL oficial.
