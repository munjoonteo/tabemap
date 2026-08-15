# Deployment Guide — 食べマップ

This guide takes you from the current local-only app to a fully deployed version
accessible on any device, with data persisted in Cloudflare KV.

## What you'll end up with

- A **Cloudflare Worker** acting as a tiny API (`tabemap-api.*.workers.dev`)
- Your restaurant data stored in **Cloudflare KV** (free, persistent, global)
- The **React app deployed to Cloudflare Pages** (`*.pages.dev` or your own domain)
- A **PWA** you can add to your iPhone home screen and use like a native app
- **Shared data** — edits on your Mac are instantly visible on your phone

---

## Prerequisites

- A Cloudflare account (free) — sign up at https://dash.cloudflare.com
- Node.js ≥ 18

---

## Step 1 — Install Wrangler

```bash
npm install -g wrangler
wrangler login
# A browser window opens — log in with your Cloudflare account
```

---

## Step 2 — Deploy the Worker

```bash
cd worker
npm install
```

Create the KV namespace:

```bash
wrangler kv namespace create RESTAURANTS
```

This prints something like:
```
{ binding = "RESTAURANTS", id = "abc123def456..." }
```

Open `worker/wrangler.toml` and replace `REPLACE_WITH_KV_NAMESPACE_ID` with that `id` value.

Set your secret API token (choose any strong password — you'll use it in step 4):

```bash
wrangler secret put API_TOKEN
# Type your chosen password and press Enter
```

Deploy the worker:

```bash
wrangler deploy
```

Note the URL it prints, e.g. `https://tabemap-api.YOUR_SUBDOMAIN.workers.dev`.
Test it works:

```bash
curl https://tabemap-api.YOUR_SUBDOMAIN.workers.dev/api/restaurants \
  -H "Authorization: Bearer YOUR_TOKEN"
# Should return []
```

---

## Step 3 — Upload your existing data

From the `scraper/` directory, upload `restaurants.json` to the worker:

```bash
curl -X PUT https://tabemap-api.YOUR_SUBDOMAIN.workers.dev/api/restaurants \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @restaurants.json
# Should return {"ok":true}
```

Verify:
```bash
curl https://tabemap-api.YOUR_SUBDOMAIN.workers.dev/api/restaurants \
  -H "Authorization: Bearer YOUR_TOKEN" | python3 -m json.tool | head -20
```

---

## Step 4 — Configure the frontend

```bash
cd app
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your values:

```
VITE_API_URL=https://tabemap-api.YOUR_SUBDOMAIN.workers.dev
VITE_API_TOKEN=your-secret-token-here
```

Test locally:
```bash
npm run dev
# Open http://localhost:5173 — your restaurants should load from Cloudflare
```

---

## Step 5 — Deploy the frontend to Cloudflare Pages

Build the app:
```bash
npm run build
```

Deploy to Pages:
```bash
wrangler pages deploy dist --project-name tabemap
```

The first deploy creates the project. Subsequent deploys use the same command.
You'll get a URL like `https://tabemap.pages.dev`.

### Set environment variables in Pages dashboard

The `.env.local` file is not deployed — you need to add the vars in Cloudflare's dashboard
so the production build can reach the worker:

1. Go to https://dash.cloudflare.com → **Workers & Pages** → **tabemap**
2. Click **Settings** → **Environment variables**
3. Add under **Production**:
   - `VITE_API_URL` = `https://tabemap-api.YOUR_SUBDOMAIN.workers.dev`
   - `VITE_API_TOKEN` = your token
4. Click **Save and deploy** (triggers a rebuild with the vars baked in)

---

## Step 6 — Add to iPhone home screen (PWA)

1. Open `https://tabemap.pages.dev` in Safari on your iPhone
2. Tap the **Share** button (box with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add**

The app icon appears on your home screen. Opening it launches fullscreen with no browser chrome,
behaves like a native app, and shares data with your Mac in real time.

---

## Custom domain (optional)

If you want `tabemap.yourdomain.com` instead of `*.pages.dev`:

1. In Cloudflare Pages → **Custom domains** → **Set up a custom domain**
2. Follow the DNS instructions (trivial if your domain is already on Cloudflare)

---

## Re-scraping after deployment

When you run `npm run rescrape` in the future, it still writes to `restaurants.json` locally.
After it completes, re-upload:

```bash
cd scraper
node scrape.js rescrape
# ... wait for it to finish ...

curl -X PUT https://tabemap-api.YOUR_SUBDOMAIN.workers.dev/api/restaurants \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @restaurants.json
```

---

## Architecture diagram

```
iPhone / Mac browser
        │
        │  HTTPS
        ▼
Cloudflare Pages          (static React app, global CDN)
        │
        │  fetch() with Bearer token
        ▼
Cloudflare Worker         (tabemap-api, ~25 lines of Hono)
        │
        │  KV read/write
        ▼
Cloudflare KV             (restaurants JSON blob)
```

---

## Troubleshooting

**"Failed to fetch restaurants"** — check `VITE_API_URL` has no trailing slash and the
worker is deployed (`wrangler deploy` from the `worker/` directory).

**401 Unauthorized** — `VITE_API_TOKEN` doesn't match the secret set with
`wrangler secret put API_TOKEN`. Re-set the secret or update the env var.

**Blank map** — likely a CORS issue if you're testing from a non-Pages URL. The worker
allows all origins, so this shouldn't happen in production.

**Data not updating on phone after Mac edit** — the app caches data in memory per session.
Pull-to-refresh or reload the page on the phone to fetch the latest from KV.

**Wrangler not found** — run `npm install -g wrangler` or use `npx wrangler` prefix instead.
