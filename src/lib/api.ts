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

export async function fetchUserFills(address: string): Promise<UserFill[]> {
  const allFills: UserFill[] = [];
  let startTime: number | undefined;

  // Paginate through all fills (2000 per request)
  while (true) {
    const payload: Record<string, unknown> = {
      type: 'userFills',
      user: address,
    };
    if (startTime !== undefined) {
      payload.startTime = startTime;
    }

    const res = await fetch(HL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Failed to fetch fills: ${res.status}`);
    const fills: UserFill[] = await res.json();

    if (fills.length === 0) break;
    allFills.push(...fills);

    // If fewer than 2000, we've reached the end
    if (fills.length < 2000) break;

    // Set startTime to the oldest fill's time for next page
    const oldestTime = Math.min(...fills.map((f) => f.time));
    if (startTime !== undefined && oldestTime >= startTime) break;
    startTime = oldestTime;
  }

  return allFills;
}

export interface FeeBreakdown {
  totalFees: number;
  hlFees: number;
  builderFees: number;
  fillCount: number;
}

export function calculateFeeBreakdown(fills: UserFill[]): FeeBreakdown {
  let totalFees = 0;
  let builderFees = 0;

  for (const fill of fills) {
    const fee = parseFloat(fill.fee);
    const bFee = fill.builderFee ? parseFloat(fill.builderFee) : 0;
    totalFees += fee;
    builderFees += bFee;
  }

  return {
    totalFees,
    hlFees: totalFees - builderFees,
    builderFees,
    fillCount: fills.length,
  };
}
