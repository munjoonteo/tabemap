import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bearerAuth } from 'hono/bearer-auth';

type Bindings = {
  RESTAURANTS: KVNamespace;
  API_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const APP_ORIGIN = 'https://tabemap.pages.dev';

app.use(
  '*',
  cors({
    origin: (_, c) => {
      const method =
        c.req.method === 'OPTIONS'
          ? (c.req.header('Access-Control-Request-Method') ?? '')
          : c.req.method;
      return method === 'PUT' ? APP_ORIGIN : '*';
    },
  }),
);

app.get('/health', (c) =>
  c.json({ ok: true, hasToken: !!c.env.API_TOKEN, hasKV: !!c.env.RESTAURANTS }),
);

// Validates the bearer token without touching data
app.get(
  '/api/validate',
  async (c, next) => {
    if (!c.env.API_TOKEN) return c.json({ error: 'not configured' }, 500);
    return bearerAuth({ token: c.env.API_TOKEN })(c, next);
  },
  (c) => c.json({ ok: true }),
);

// Reads are public — no auth required
app.get('/api/restaurants', async (c) => {
  const data = await c.env.RESTAURANTS.get('restaurants');
  return c.json(data ? JSON.parse(data) : []);
});

// Writes require the bearer token
app.put(
  '/api/restaurants',
  async (c, next) => {
    if (!c.env.API_TOKEN) return c.json({ error: 'API_TOKEN secret not configured' }, 500);
    return bearerAuth({ token: c.env.API_TOKEN })(c, next);
  },
  async (c) => {
    const text = await c.req.text();
    if (text.length > 24 * 1024 * 1024) {
      return c.json({ error: 'payload exceeds 24 MB KV limit' }, 413);
    }
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return c.json({ error: 'invalid JSON' }, 400);
    }
    if (!Array.isArray(body)) return c.json({ error: 'body must be an array' }, 400);
    if (body.length > 0 && (typeof body[0].id !== 'string' || typeof body[0].name !== 'string')) {
      return c.json({ error: 'invalid restaurant shape' }, 400);
    }
    await c.env.RESTAURANTS.put('restaurants', text);
    return c.json({ ok: true });
  },
);

export default app;
