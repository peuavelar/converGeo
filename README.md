# ConverGeo Front (localhost)

Base local alinhada ao front oficial do repositório
[`devThiago1/ConverGeo`](https://github.com/devThiago1/ConverGeo) em `frontend/convergeo-web`.

## Stack

- Next.js + TypeScript + Tailwind
- MapLibre + Deck.gl (H3HexagonLayer)
- API: FastAPI (`/score`, `/top`) via `NEXT_PUBLIC_API_URL`

## Rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Variáveis

Crie `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://convergeo.onrender.com
```

Alternativa HML:

```env
NEXT_PUBLIC_API_URL=https://convergeo-hml.vercel.app/backend
```

## Origem

Código sincronizado de `frontend/convergeo-web` do GitHub.
A pasta `reference-api/` guarda `api/main.py` para referência local.
