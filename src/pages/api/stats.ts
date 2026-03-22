import type { APIRoute } from 'astro';

export const prerender = false;

const BASE_USERS = 847;
const BASE_SAVINGS = 1_247_500;

const KV_KEY_USERS = 'stats:users';
const KV_KEY_SAVINGS = 'stats:savings';

export const GET: APIRoute = async () => {
  let kv: any = null;

  try {
    const { env } = await import('cloudflare:workers');
    kv = (env as any).CACHE;
  } catch {
    // Not in Cloudflare runtime (local dev)
  }

  let kvUsers = 0;
  let kvSavings = 0;

  if (kv) {
    try {
      const [u, s] = await Promise.all([
        kv.get(KV_KEY_USERS),
        kv.get(KV_KEY_SAVINGS),
      ]);
      kvUsers = parseInt(u, 10) || 0;
      kvSavings = parseFloat(s) || 0;
    } catch {}
  }

  return new Response(JSON.stringify({
    users: BASE_USERS + kvUsers,
    savings: BASE_SAVINGS + kvSavings,
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  let kv: any = null;

  try {
    const { env } = await import('cloudflare:workers');
    kv = (env as any).CACHE;
  } catch {
    return new Response(JSON.stringify({ error: 'KV not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let savingsAmount = 500;
  try {
    const body = await request.json();
    if (typeof body.savings === 'number' && body.savings > 0) {
      savingsAmount = body.savings;
    }
  } catch {}

  try {
    const [currentUsers, currentSavings] = await Promise.all([
      kv.get(KV_KEY_USERS),
      kv.get(KV_KEY_SAVINGS),
    ]);

    const newUsers = (parseInt(currentUsers, 10) || 0) + 1;
    const newSavings = (parseFloat(currentSavings) || 0) + savingsAmount;

    await Promise.all([
      kv.put(KV_KEY_USERS, String(newUsers)),
      kv.put(KV_KEY_SAVINGS, String(newSavings)),
    ]);

    return new Response(JSON.stringify({
      users: BASE_USERS + newUsers,
      savings: BASE_SAVINGS + newSavings,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to update stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
