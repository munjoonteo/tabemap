# 食べマップ (Tabemap)

A personal restaurant map built on top of Tabelog saved restaurants. Combines a filterable sidebar with an interactive Leaflet map, custom tags, award tracking, visited status, dark mode, and English/Japanese toggle.

**Live:** https://tabemap.pages.dev

---

## Repo structure

```
tabelog/
├── app/         React frontend (Vite + Tailwind v4 + Leaflet)
├── scraper/     Playwright scraper — builds restaurants.json
├── worker/      Cloudflare Worker — REST API over KV store
└── DEPLOYMENT.md
```

---

## App

```bash
cd app
npm install
```

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server at localhost:5173 |
| `npm run build` | TypeScript check + production build → `dist/` |
| `npm run deploy` | Build then deploy to Cloudflare Pages |
| `npm run format` | Run Prettier over all `.ts/.tsx` files |
| `npm run lint` | Run oxlint |

**Environment variables** — copy `app/.env.local.example` to `app/.env.local`:

```
VITE_API_URL=https://tabemap-api.tabemap.workers.dev
```

Without `VITE_API_URL` the app falls back to browser IndexedDB (fully offline).

---

## Scraper

All commands run from the `scraper/` directory. Chrome must be fully quit (`Cmd+Q`) before running.

```bash
cd scraper
npm install
npx playwright install chromium
```

| Command | Description |
|---|---|
| `npm run scrape` | Full scrape — visits every saved restaurant page, writes `restaurants.json` |
| `npm run sync` | Incremental sync — scrapes list pages to diff URLs, only visits detail pages for new restaurants. Preserves tags/notes/visited on existing entries. Creates a timestamped backup before writing. |
| `npm run sync-visited` | Scrapes the visited-restaurants list and marks matching entries `visited: true` in `restaurants.json` |
| `npm run format` | Run Prettier over scraper scripts |

**Key URLs (teomunjoon account):**
- Saved list: `https://tabelog.com/rvwr/teomunjoon/hozon_restaurants/list`
- Visited list: `https://tabelog.com/rvwr/teomunjoon/visited_restaurants/list/`

**Typical workflow after scraping:**
1. Run `npm run sync` — logs in, diffs list, scrapes new restaurants only
2. Verify output: `node -e "const d=require('fs').readFileSync('./restaurants.json'); console.log(JSON.parse(d).length, 'restaurants')"`
3. Upload to Cloudflare (see below)

---

## Worker

```bash
cd worker
npm install
```

| Command | Description |
|---|---|
| `wrangler dev` | Run worker locally |
| `wrangler deploy` | Deploy worker to Cloudflare |
| `TOKEN=xxx npm run upload-data` | Upload `restaurants.json` to Cloudflare KV |

**Setting / changing the API token:**
```bash
cd worker
wrangler secret put API_TOKEN
# type your chosen password and press Enter
wrangler deploy
```

**Uploading restaurant data:**
```bash
cd worker
TOKEN=your-token-here npm run upload-data
```

**Health check:**
```bash
node -e "fetch('https://tabemap-api.tabemap.workers.dev/health').then(r=>r.json()).then(console.log)"
# → { ok: true, hasToken: true, hasKV: true }
```

**Quick KV backup:**
```bash
node -e "
const fs = require('fs')
fetch('https://tabemap-api.tabemap.workers.dev/api/restaurants')
  .then(r => r.json())
  .then(d => { fs.writeFileSync('./kv-backup.json', JSON.stringify(d,null,2)); console.log('Saved', d.length, 'restaurants') })
"
```

---

## Full update workflow

After a session of adding new saves on Tabelog:

```bash
# 1. sync new restaurants
cd scraper
npm run sync

# 2. optionally sync visited status
npm run sync-visited

# 3. upload to Cloudflare
cd ../worker
TOKEN=your-token-here npm run upload-data

# 4. redeploy app if there were code changes
cd ../app
npm run deploy
```

---

## First-time setup

See **DEPLOYMENT.md** for the complete guide covering:
- Creating the Cloudflare Worker and KV namespace
- Setting secrets
- Deploying to Cloudflare Pages
- Adding the app to your iPhone home screen (PWA)

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS v4 |
| Map | Leaflet + leaflet.markercluster, CartoDB Voyager tiles |
| Persistence | Cloudflare Workers + KV (production), IndexedDB (local) |
| Scraper | Playwright (Chromium) |
| Worker | Hono on Cloudflare Workers |
| Deploy | Cloudflare Pages |
