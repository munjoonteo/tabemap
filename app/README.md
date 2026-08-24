# 食べマップ — App

React frontend for the Tabemap personal restaurant map.

See the root [`README.md`](../README.md) for full project documentation and the [`DEPLOYMENT.md`](../DEPLOYMENT.md) for setup instructions.

## Local development

```bash
npm install
npm run dev       # dev server at localhost:5173
npm run build     # type-check + production build
npm run lint      # oxlint
npm run format    # prettier
npm run deploy    # build + deploy to Cloudflare Pages
```

## Environment variables

Copy `.env.local.example` to `.env.local`:

```
VITE_API_URL=https://tabemap-api.YOUR_SUBDOMAIN.workers.dev
```

Without `VITE_API_URL` the app uses browser IndexedDB (fully offline, no sync).
