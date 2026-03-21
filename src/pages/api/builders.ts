import type { APIRoute } from 'astro';
import buildersCache from '../../data/builders-cache.json';

export const prerender = false;

// Cache in KV for 1 hour to reduce D1 reads
const KV_CACHE_TTL = 3600;
const KV_CACHE_KEY = 'builders:d1';

export const GET: APIRoute = async () => {
  let kv: any = null;
  let db: any = null;

  try {
    const { env } = await import('cloudflare:workers');
    kv = (env as any).CACHE;
    db = (env as any).BUILDERS_DB;
  } catch {
    // Not in Cloudflare runtime (local dev)
  }

  // 1. Try KV cache (fast, reduces D1 reads)
  if (kv) {
    try {
      const cached = await kv.get(KV_CACHE_KEY);
      if (cached) {
        return new Response(cached, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300, s-maxage=3600',
            'X-Cache': 'HIT',
          },
        });
      }
    } catch {}
  }

  // 2. Try D1 database (source of truth)
  if (db) {
    try {
      const { results } = await db.prepare(
        'SELECT ref_code, address, usage_fee, users, volume, revenue, time_joined FROM builders ORDER BY usage_fee ASC'
      ).all();

      const builders = results.map((r: any) => ({
        refCode: r.ref_code,
        address: r.address,
        usageFee: r.usage_fee,
        users: r.users,
        volume: r.volume,
        revenue: r.revenue,
        timeJoined: r.time_joined,
      }));

      const responseBody = JSON.stringify({ builders });

      // Cache in KV for 1 hour
      if (kv) {
        try { await kv.put(KV_CACHE_KEY, responseBody, { expirationTtl: KV_CACHE_TTL }); } catch {}
      }

      return new Response(responseBody, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=3600',
          'X-Cache': 'D1',
        },
      });
    } catch {
      // D1 failed, fall through to local cache
    }
  }

  // 3. Fallback: local cached data (always available)
  const cached = (buildersCache as any).builders ?? buildersCache;
  const builders = Array.isArray(cached) ? cached : [];

  return new Response(JSON.stringify({ builders }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'X-Cache': 'LOCAL',
    },
  });
};
