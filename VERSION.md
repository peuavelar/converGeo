# ConverGeo Web — v1.1.0+

## Release
- **Versão:** 1.1.0 (base) + UX mapa/marketplace
- **Dados:** mocks Salvador + POIs reais via OpenStreetMap (Overpass)
- **Plataformas:** Web responsiva + PWA

## O que mudou (sessão recente)
- Busca na barra de filtros + placeholder animado “Busque um endereço”
- Clique no mapa: card “À venda por aqui” (3 imóveis) + dados do bairro
- Marketplace filtrado por bairro (“Ver todos na região”)
- POIs com ícones: restaurantes, hospitais, delegacias, escolas (Overpass)
- Tooltip do POI à direita (sem botão Legenda)
- Sino Analytics (renome) + UI de Regiões/Tempo compactas
- Mapa: pan/zoom mobile e `touch-action: none`

## Produção
- Source maps do browser desabilitados
- `console.*` removido no build (exceto warn/error)
- Headers de segurança básicos
- Manifest PWA + service worker em `/sw.js`

## APIs públicas
- Overpass: https://overpass-api.de/api/interpreter
- Overpass Turbo: https://overpass-turbo.eu/
- Nominatim: https://nominatim.openstreetmap.org/
