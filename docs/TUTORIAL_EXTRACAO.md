# Tutorial — extrair dados no modo Negócio

Site: https://convergeo-front.vercel.app  
Mapa: **modo escuro** (padrão; melhor leitura dos hexágonos).

Não comece pelo campo de endereço. O endereço é análise de **um** ponto. A extração da grade começa no **segmento**.

## Ordem correta

1. **Abrir meu Negócio** (topo).
2. Confirme o mapa escuro (botão *Modo noturno* se estiver claro).
3. **Segmento** — recorte CNAE (ex.: Restaurantes, Farmácia). Sem isso a matriz é de outro negócio.
4. **Raio-X** — pede os melhores hexágonos no Postgres (`/api/negocio/top`).
5. Opcional: **Filtro de nota mínima** para enxugar o conjunto.
6. **Exportar Matriz (CSV)** — `ID_H3`, localização, nota ponderada, demografia, saturação, fluxo.

## Depois da matriz

- **Top 5** + *Exportar Top 5 (CSV)* — ranking curto.
- **Endereço** — um hexágono (Pituba, rua, etc.).
- **Comparar A/B** — dois bairros, não substitui o CSV da grade.

## O que o CSV é (e não é)

É score v1 da grade H3 res 8 Salvador (camada OSM/comportamental agora).  
Não é dump IBGE/Receita. Não é scrape de portal.
