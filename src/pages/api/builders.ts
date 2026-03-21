import type { APIRoute } from 'astro';

export const prerender = false;

const CACHE_TTL = 86400; // 24 hours in seconds
const CACHE_KEY = 'builders:all';
const CMM_API = 'https://ht-api.coinmarketman.com/api/external/builders/list/timeframe/all';

export const GET: APIRoute = async () => {
  // Access Cloudflare bindings via cloudflare:workers module
  let kv: any = null;
  let apiKey: string | undefined;

  try {
    const { env } = await import('cloudflare:workers');
    kv = (env as any).CACHE;
    apiKey = (env as any).CMM_API_KEY;
  } catch {
    // Not in Cloudflare environment (local dev without wrangler)
  }

  // Try cache first
  if (kv) {
    try {
      const cached = await kv.get(CACHE_KEY);
      if (cached) {
        return new Response(cached, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
            'X-Cache': 'HIT',
          },
        });
      }
    } catch {
      // KV not available, continue to fetch
    }
  }

  // Fetch from CoinMarketMan API
  if (!apiKey) {
    // Return mock data for local development
    return new Response(JSON.stringify({ builders: getMockBuilders() }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(CMM_API, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`CoinMarketMan API returned ${res.status}`);
    }

    const data = await res.json();
    const responseBody = JSON.stringify(data);

    // Cache in KV
    if (kv) {
      try {
        await kv.put(CACHE_KEY, responseBody, { expirationTtl: CACHE_TTL });
      } catch {
        // Non-critical: continue without caching
      }
    }

    return new Response(responseBody, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'MISS',
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch builder data', builders: getMockBuilders() }),
      {
        status: 200, // Still return 200 with mock data as fallback
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

function getMockBuilders() {
  return [
    { refCode: 'Phantom', address: '0xb84168cf3be63c6b8dad05ff5d755e97432ff80b', usageFee: 0.0005, users: 121714, volume: 32869400819, revenue: 17241054 },
    { refCode: 'Based', address: '0x1924b8561eef20e70ede628a296175d358be80e5', usageFee: 0.0008, users: 41252, volume: 40606299303, revenue: 14068351 },
    { refCode: 'MetaMask', address: '0x2222222222222222222222222222222222222222', usageFee: 0.001, users: 35000, volume: 25000000000, revenue: 10000000 },
    { refCode: 'Rabby', address: '0x3333333333333333333333333333333333333333', usageFee: 0.0003, users: 18000, volume: 15000000000, revenue: 3000000 },
    { refCode: '1KREF', address: '0x4444444444444444444444444444444444444444', usageFee: 0, users: 5000, volume: 2000000000, revenue: 0 },
    { refCode: 'OKX', address: '0x5555555555555555555555555555555555555555', usageFee: 0.0006, users: 28000, volume: 20000000000, revenue: 8000000 },
    { refCode: 'Bybit', address: '0x6666666666666666666666666666666666666666', usageFee: 0.0004, users: 22000, volume: 18000000000, revenue: 5000000 },
    { refCode: 'Backpack', address: '0x7777777777777777777777777777777777777777', usageFee: 0.0002, users: 10000, volume: 8000000000, revenue: 1200000 },
  ];
}
