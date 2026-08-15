import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bearerAuth } from 'hono/bearer-auth';

type Bindings = {
  RESTAURANTS: KVNamespace;
  API_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({ origin: '*' }));

app.get('/health', (c) =>
  c.json({ ok: true, hasToken: !!c.env.API_TOKEN, hasKV: !!c.env.RESTAURANTS }),
);

// Reads are public — no auth required
app.get('/api/restaurants', async (c) => {
  const data = await c.env.RESTAURANTS.get('restaurants');
  return c.json(data ? JSON.parse(data) : []);
});

// Writes require the bearer token
app.put(
  '/api/restaurants',
  (c, next) => bearerAuth({ token: c.env.API_TOKEN })(c, next),
  async (c) => {
    if (!c.env.API_TOKEN) return c.json({ error: 'API_TOKEN secret not configured' }, 500);
    const body = await c.req.json();
    await c.env.RESTAURANTS.put('restaurants', JSON.stringify(body));
    return c.json({ ok: true });
  },
);

export default app;
