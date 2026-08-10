# ConverGeo Web — v1.0.0

## Release
- **Versão:** 1.0.0
- **Data:** 2026-08-10
- **Dados:** fictícios / mock locais (Salvador)
- **Plataformas:** Web responsiva + PWA (Android / iPhone)

## Produção
- Source maps do browser desabilitados
- `console.*` removido no build (exceto warn/error)
- Headers de segurança básicos
- Manifest PWA + service worker em `/sw.js`

## Nota de segurança
Código que roda no navegador **não pode ser 100% ocultado**. Minificação e ausência de source maps dificultam a leitura, mas não impedem inspeção avançada. Segredos e lógica sensível devem ficar no backend.
