# Changelog

Todas as mudanças relevantes do frontend ConverGeo.

Formato inspirado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).
Versionamento: [SemVer](https://semver.org/lang/pt-BR/).

## [1.3.0] — 2026-09-16

### Added
- Motor Python em `engine/` (ETL H3 mascarado, IBGE com renda real, CNPJ geocodificado, OSM, API v1+v2)
- Marketplace: schema, CSV/VRSync, preço justo, página **Anuncie**
- Flag `NEXT_PUBLIC_MARKETPLACE_SOURCE=mock|api` (padrão mock)
- Front de produção: sem source maps, `/api/health` sem origem interna, cron exige `CRON_SECRET` na Vercel
- ADRs em `docs/adr/` e `docs/PITCH_NUMEROS.md`

### Changed
- Fonte de verdade do score: FastAPI (`engine/`), não API Java
- `reference-api/` removido (paridade v1 em `engine/`)

## [1.2.0] — 2026-08-11

### Added
- Transição de loading ao trocar **Comprar** ↔ **Abrir meu Negócio**
- Comparação A/B por digitação de regiões (`lib/negocio/compareRegions`)
- Hooks: `useNearbyPlaces`, `useNegocioMap`, builders em `app/map/`
- Benchmarks externos opcionais (coleta + score calibrado S1)
- Cobertura metro: Salvador + Lauro de Freitas

### Changed
- `page.tsx` refatorado (~1640 → ~1130 linhas)
- Header / Negócio: tipografia menor, nav centralizado, logo geo
- UX mobile: pin card, RegionHexSheet, MapControls, tab bar

### Docs
- README redesenhado para o GitHub
- `VERSION.md` + este CHANGELOG
- Benchmarks documentados em `docs/BENCHMARKS.md`
- `contexto.md` + `docs/RELEASE_1.2.0.md` (evolução da versão)

## [1.1.0] — 2026-04

- OSM BFF (nearby / geocode / reverse)
- Card “À venda por aqui” + marketplace por região
- PWA + hardening de produção

## [1.0.0] — 2026-03

- Release inicial MapLibre + Deck.gl + mocks Salvador

[1.3.0]: https://github.com/peuavelar/converGeo/releases/tag/v1.3.0
[1.2.0]: https://github.com/peuavelar/converGeo/releases/tag/v1.2.0
[1.1.0]: https://github.com/peuavelar/converGeo/releases/tag/v1.1.0
[1.0.0]: https://github.com/peuavelar/converGeo/releases/tag/v1.0.0
