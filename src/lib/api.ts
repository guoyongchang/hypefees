import type { Builder } from './fees';

// Fetch builder list from our API proxy
export async function fetchBuilders(): Promise<Builder[]> {
  const res = await fetch('/api/builders');
  if (!res.ok) throw new Error(`Failed to fetch builders: ${res.status}`);
  const data = await res.json();
  return data.builders;
}

// Hyperliquid public API - no key needed
const HL_API = 'https://api.hyperliquid.xyz/info';

export interface UserFill {
  coin: string;
  px: string;
  sz: string;
  side: string;
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
  feeToken: string;
  builderFee?: string;
}

export type FillProgress = {
  loaded: number;
  status: string;
};

/**
 * Fetch ALL user fills using userFillsByTime for complete history.
 * Paginates forward from time=0 in chunks of 2000.
 */
export async function fetchUserFills(
  address: string,
  onProgress?: (progress: FillProgress) => void,
): Promise<UserFill[]> {
  const allFills: UserFill[] = [];
  let startTime = 0;
  const seen = new Set<number>(); // deduplicate by tid

  while (true) {
    onProgress?.({ loaded: allFills.length, status: `Loading trades...` });

    const res = await fetch(HL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'userFillsByTime',
        user: address,
        startTime,
      }),
    });

    if (!res.ok) throw new Error(`Failed to fetch fills: ${res.status}`);
    const fills: UserFill[] = await res.json();

    if (fills.length === 0) break;

    // Deduplicate and add
    let added = 0;
    for (const fill of fills) {
      if (!seen.has(fill.tid)) {
        seen.add(fill.tid);
        allFills.push(fill);
        added++;
      }
    }

    // If no new fills were added, we're done
    if (added === 0) break;

    // If fewer than 2000, we've reached the end
    if (fills.length < 2000) break;

    // Move startTime forward to the latest fill's time + 1
    const latestTime = Math.max(...fills.map((f) => f.time));
    if (latestTime <= startTime) break; // safety: prevent infinite loop
    startTime = latestTime + 1;
  }

  onProgress?.({ loaded: allFills.length, status: 'Done' });
  return allFills;
}

export interface FeeBreakdown {
  totalFees: number;
  hlFees: number;
  builderFees: number;
  fillCount: number;
  totalVolume: number;
  firstTradeTime: number | null;
  lastTradeTime: number | null;
}

export function calculateFeeBreakdown(fills: UserFill[]): FeeBreakdown {
  let totalFees = 0;
  let builderFees = 0;
  let totalVolume = 0;
  let firstTradeTime: number | null = null;
  let lastTradeTime: number | null = null;

  for (const fill of fills) {
    const fee = parseFloat(fill.fee);
    const bFee = fill.builderFee ? parseFloat(fill.builderFee) : 0;
    const notional = parseFloat(fill.px) * parseFloat(fill.sz);

    totalFees += fee;
    builderFees += bFee;
    totalVolume += notional;

    if (firstTradeTime === null || fill.time < firstTradeTime) firstTradeTime = fill.time;
    if (lastTradeTime === null || fill.time > lastTradeTime) lastTradeTime = fill.time;
  }

  return {
    totalFees,
    hlFees: totalFees - builderFees,
    builderFees,
    fillCount: fills.length,
    totalVolume,
    firstTradeTime,
    lastTradeTime,
  };
}
