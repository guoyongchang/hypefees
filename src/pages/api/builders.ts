import type { APIRoute } from 'astro';
import buildersCache from '../../data/builders-cache.json';

export const prerender = false;

const CACHE_TTL = 86400; // 24 hours
const CACHE_KEY = 'builders:all';
const CMM_API = 'https://ht-api.coinmarketman.com/api/external/builders/list/timeframe/all';

// Filter to meaningful builders: has a name and has users.
// Deduplicate by refCode — keep the entry with the most users.
function filterBuilders(builders: any[]) {
  const byCode = new Map<string, any>();
  for (const b of builders) {
    if (!b.refCode || b.users <= 0) continue;
    const existing = byCode.get(b.refCode);
    if (!existing || b.users > existing.users) {
      byCode.set(b.refCode, b);
    }
  }
  return [...byCode.values()].sort((a: any, b: any) => a.usageFee - b.usageFee);
}

export const GET: APIRoute = async () => {
  // 1. Try Cloudflare KV cache (production)
  let kv: any = null;
  let apiKey: string | undefined;

  try {
    const { env } = await import('cloudflare:workers');
    kv = (env as any).CACHE;
    apiKey = (env as any).CMM_API_KEY;
  } catch {
    // Not in Cloudflare runtime
  }

  if (kv) {
    try {
      const cached = await kv.get(CACHE_KEY);
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

  // 2. Try live API (if key available, respects free tier)
  if (apiKey) {
    try {
      const res = await fetch(CMM_API, {
        headers: { accept: 'application/json', Authorization: `Bearer ${apiKey}` },
        redirect: 'follow',
      });
      if (res.ok) {
        const data = await res.json();
        const filtered = filterBuilders(data.builders ?? []);
        const responseBody = JSON.stringify({ builders: filtered });

        // Cache in KV for 24h
        if (kv) {
          try { await kv.put(CACHE_KEY, responseBody, { expirationTtl: CACHE_TTL }); } catch {}
        }

        return new Response(responseBody, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300, s-maxage=3600',
            'X-Cache': 'MISS',
          },
        });
      }
    } catch {
      // API failed, fall through to local cache
    }
  }

  // 3. Fallback: local cached data (always available, never hits API)
  const cached = (buildersCache as any).builders ?? buildersCache;
  const filtered = filterBuilders(Array.isArray(cached) ? cached : []);

  return new Response(JSON.stringify({ builders: filtered }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'X-Cache': 'LOCAL',
    },
  });
};
