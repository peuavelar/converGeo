# ConverGeo Web — v1.2.0

## Release
- **Versão:** 1.2.0
- **Dados:** mocks Salvador/Lauro + POIs OSM + benchmarks opcionais
- **Plataformas:** Web responsiva + PWA

## O que mudou (1.2.0)
- Transição de loading ao trocar Comprar ↔ Negócio
- Refatoração: `page.tsx` enxuto com hooks (`useNearbyPlaces`, `useNegocioMap`) e builders de camadas do mapa
- Helpers compartilhados: score dinâmico, listas de comparação A/B, export CSV, fetch de hex scores
- Negócio: comparação A/B por digitação (regiões Salvador + Lauro de Freitas)
- Benchmarks externos (S1) atrás de flag — score calibrado derivado
- Docs GitHub: README + CHANGELOG
- Documentação de release: [docs/RELEASE_1.2.0.md](./docs/RELEASE_1.2.0.md)
- Contexto para agentes/equipe: [contexto.md](./contexto.md)

## Produção
- Source maps do browser desabilitados
- `console.*` removido no build (exceto warn/error)
- Headers de segurança básicos
- Manifest PWA + service worker em `/sw.js`

## APIs públicas
- Overpass: https://overpass-api.de/api/interpreter
- Nominatim: https://nominatim.openstreetmap.org/
