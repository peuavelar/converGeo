# ADR 0006 — LGPD no marketplace

## Contexto
Anunciantes pessoa física podem informar documento/telefone.

## Decisão
- API pública **não** devolve `documento` nem telefone de PF.
- `ocultar_endereco=true` expõe só o centróide do hexágono H3.
- Base legal do cadastro de anunciante PJ: execução de contrato / legítimo interesse de oferta pública de imóvel. PF: consentimento no fluxo Anuncie (`A VERIFICAR` com jurídico).
- API keys armazenadas só como SHA-256.

## Alternativas
- Endereço sempre visível: rejeitado para segurança do anunciante.

## Consequências
Mapa pode agrupar pins no centro do hexágono quando o endereço está oculto.
