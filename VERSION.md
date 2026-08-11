# ConverGeo Web — v1.1.0

## Release
- **Versão:** 1.1.0
- **Data:** 2026-08-10
- **Dados:** fictícios / mock locais (Salvador)
- **Plataformas:** Web responsiva + PWA (Android / iPhone)

## O que mudou (1.1.0)
- Mobile: mapa em 1º acesso + botão Menu; painel em folha inferior
- Marketplace em tela cheia no celular com “Voltar ao mapa”
- Barra: Para você / Tempo / Regiões / Comparar + Filtro (sem Buscar no mobile)
- Modo claro / noturno no mapa (web e mobile)
- Botões Marketplace, Menu e Voltar ao mapa mais compactos
- Header desktop: busca central, Ajuda e Entrar à direita
- Ranking de oportunidades em menu suspenso (Sino Mobile)

## Produção
- Source maps do browser desabilitados
- `console.*` removido no build (exceto warn/error)
- Headers de segurança básicos
- Manifest PWA + service worker em `/sw.js`

## Nota de segurança
Código que roda no navegador **não pode ser 100% ocultado**. Minificação e ausência de source maps dificultam a leitura, mas não impedem inspeção avançada. Segredos e lógica sensível devem ficar no backend.
