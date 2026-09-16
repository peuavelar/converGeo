# ADR 0002 — Rateio IBGE por área

## Contexto
O motor antigo atribuía o setor censitário inteiro ao hexágono do centróide (D4), distorcendo população.

## Decisão
Interseção polígono do setor × polígono do hexágono; população e domicílios rateados pela **fração de área do setor**.

Não usamos área “efetivamente domiciliada” nesta versão: o Censo 2022 por setor não traz essa máscara de forma estável no produto de agregados usado aqui (`A VERIFICAR` se o IBGE publicar camada de face de quadra utilizável).

## Alternativas
- Rateio por população das faces: melhor, dados ainda incompletos.
- Centroide: rejeitado (D4).

## Consequências
Hexágonos na borda recebem frações; totais municipais se conservam a menos de recortes de máscara.
