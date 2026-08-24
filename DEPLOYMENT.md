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

Open `worker/wrangler.toml` and replace the existing `id` value with the one printed above.

Set your secret API token (choose any strong password — this becomes your app login password):

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
curl https://tabemap-api.YOUR_SUBDOMAIN.workers.dev/health
# Should return {"ok":true,"hasToken":true,"hasKV":true}
```

---

## Step 3 — Upload your existing data

From the `worker/` directory, upload `restaurants.json` to the worker:

```bash
TOKEN=YOUR_TOKEN npm run upload-data
```

Or using curl directly from the `scraper/` directory:

```bash
curl -X PUT https://tabemap-api.YOUR_SUBDOMAIN.workers.dev/api/restaurants \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @restaurants.json
# Should return {"ok":true}
```

---

## Step 4 — Configure the frontend

```bash
cd app
cp .env.local.example .env.local
```

Edit `.env.local` and set your worker URL:

```
VITE_API_URL=https://tabemap-api.YOUR_SUBDOMAIN.workers.dev
```

Test locally:
```bash
npm run dev
# Open http://localhost:5173 — your restaurants should load from Cloudflare
# Click the Login button (🔒) and enter your API_TOKEN to unlock editing
```

---

## Step 5 — Deploy the frontend to Cloudflare Pages

```bash
npm run deploy
```

This builds and deploys in one step. The first deploy creates the project. You'll get a URL like `https://tabemap.pages.dev`.

### Set environment variables in Pages dashboard

The `.env.local` file is not deployed — you need to add the variable in Cloudflare's dashboard so the production build can reach the worker:

1. Go to https://dash.cloudflare.com → **Workers & Pages** → **tabemap**
2. Click **Settings** → **Environment variables**
3. Add under **Production**:
   - `VITE_API_URL` = `https://tabemap-api.YOUR_SUBDOMAIN.workers.dev`
4. Click **Save and deploy** (triggers a rebuild with the variable baked in)

> The API token is **not** an environment variable — it is entered at runtime via the Login button and kept in memory only. You do not need to store it in the Pages dashboard.

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

When you run the scraper in the future, it writes to `restaurants.json` locally.
After it completes, re-upload:

```bash
cd scraper
npm run sync
# ... wait for it to finish ...

cd ../worker
TOKEN=your-token-here npm run upload-data
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
        │  fetch() — reads public, writes with Bearer token
        ▼
Cloudflare Worker         (tabemap-api, ~40 lines of Hono)
        │
        │  KV read/write
        ▼
Cloudflare KV             (restaurants JSON blob, max 24 MB)
```

---

## Troubleshooting

**"Failed to load restaurants"** — check `VITE_API_URL` has no trailing slash and the
worker is deployed (`wrangler deploy` from the `worker/` directory).

**Login shows "Incorrect password"** — the typed password doesn't match the secret set with
`wrangler secret put API_TOKEN`. Re-set the secret with that command and redeploy the worker.

**Login shows "Could not reach server"** — the worker URL is unreachable. Check `VITE_API_URL`
is set correctly and the worker is deployed.

**Data not updating on phone after Mac edit** — the app caches data in memory per session.
Reload the page on the phone to fetch the latest from KV.

**Wrangler not found** — run `npm install -g wrangler` or use `npx wrangler` prefix instead.
