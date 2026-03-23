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
  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error('Invalid Ethereum address');
  }

  const allFills: UserFill[] = [];
  let startTime = 0;
  const seen = new Set<number>(); // deduplicate by tid

  while (true) {
    onProgress?.({ loaded: allFills.length, status: `Loading trades...` });

    let res: Response | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      res = await fetch(HL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'userFillsByTime',
          user: address,
          startTime,
        }),
      });
      if (res.status !== 429) break;
      // Exponential backoff: 1s, 2s, 4s
      const wait = Math.pow(2, attempt) * 1000;
      onProgress?.({ loaded: allFills.length, status: `Rate limited, retrying in ${wait / 1000}s...` });
      await new Promise((r) => setTimeout(r, wait));
    }

    if (!res || !res.ok) throw new Error(res?.status === 429 ? 'Hyperliquid API rate limit — please try again in a minute' : `Failed to fetch fills: ${res?.status}`);
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

    // Small delay between pages to avoid rate limiting
    await new Promise((r) => setTimeout(r, 200));
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
  /** Most recent builder address (from last trade), null if no builder fees */
  lastBuilderAddress: string | null;
}

/** Result of querying current builder approval status */
export interface BuilderApprovalStatus {
  /** Builder address */
  builder: string;
  /** Builder display name (if known) */
  name: string | null;
  /** Max approved fee in basis points (0 = 0%, 10 = 0.01%) */
  maxFeeRaw: number;
  /** Max approved fee as percentage string */
  maxFeePercent: string;
}

/**
 * Query current builder fee approval for a user-builder pair.
 * Returns the max fee rate in tenths of a basis point.
 * API: POST /info { type: "maxBuilderFee", user, builder }
 */
export async function queryBuilderApproval(
  userAddress: string,
  builderAddress: string,
): Promise<number> {
  try {
    const res = await fetch(HL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'maxBuilderFee',
        user: userAddress,
        builder: builderAddress,
      }),
    });
    if (!res.ok) return -1; // unknown
    const val = await res.json();
    return typeof val === 'number' ? val : -1;
  } catch {
    return -1; // network error, treat as unknown
  }
}

/** Known builder addresses → names */
const KNOWN_BUILDERS: Record<string, string> = {
  '0x9b12e858da780a96876e3018780cf0d83359b0bb': 'OneKey',
  '0xbf4c993acadb9e21ea42e5e0e6bf9661e6791036': 'Rabby',
  '0x4f63a22b5031d3541f88b2b7164b7c70cace1188': 'Phantom',
  '0x885e20001c4895c5ba920ea1bea4cdaac85c6d31': 'MetaMask',
  '0x2e7f9df30f05e2fa2b2b9293cf92bd6be4a9e35f': 'Based',
  '0x8ab0b2be39563c0e9e2b0bea3e25b1e46d6e8b41': 'Rainbow',
  '0x5f83e8da9410d21abbe08e2aee14bf8fa13286c0': 'Axiom',
};

/** Referral info returned from Hyperliquid API */
export interface ReferralInfo {
  /** Whether user has a referrer set */
  hasReferrer: boolean;
  /** Referrer address (if set) */
  referrerAddress: string | null;
  /** Referrer name (if known) */
  referrerName: string | null;
  /** Referral code used */
  referralCode: string | null;
  /** Whether referrer is OneKey */
  isOnOneKey: boolean;
}

/**
 * Query the current builder/referral status for a user.
 * Uses the `referral` endpoint which reliably shows who referred the user.
 * The `maxBuilderFee` endpoint returns 0 for both "never approved" and "approved at 0%",
 * making it useless for determining if an approval exists.
 */
export async function queryCurrentBuilderStatus(
  userAddress: string,
  _lastBuilderAddress: string | null,
): Promise<{ onekey: BuilderApprovalStatus; referral: ReferralInfo; lastBuilder: BuilderApprovalStatus | null }> {
  const ONEKEY = '0x9b12e858da780a96876e3018780cf0d83359b0bb';

  // Query referral info — this is the reliable way to check if user is on OneKey
  let referral: ReferralInfo = {
    hasReferrer: false,
    referrerAddress: null,
    referrerName: null,
    referralCode: null,
    isOnOneKey: false,
  };

  try {
    const res = await fetch(HL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'referral', user: userAddress }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.referredBy) {
        const refAddr = data.referredBy.referrer?.toLowerCase();
        referral = {
          hasReferrer: true,
          referrerAddress: data.referredBy.referrer,
          referrerName: KNOWN_BUILDERS[refAddr] || null,
          referralCode: data.referredBy.code || null,
          isOnOneKey: refAddr === ONEKEY.toLowerCase(),
        };
      }
    }
  } catch {
    // Silently fail — supplementary info
  }

  // For OneKey status, we can only confirm via referral binding
  // maxBuilderFee API returns 0 for both "never set" and "set to 0%"
  const onekeyStatus: BuilderApprovalStatus = {
    builder: ONEKEY,
    name: 'OneKey',
    // Use referral info as the source of truth
    maxFeeRaw: referral.isOnOneKey ? 0 : -1, // 0 = confirmed on OneKey, -1 = unknown/not set
    maxFeePercent: referral.isOnOneKey ? '0%' : '—',
  };

  return { onekey: onekeyStatus, referral, lastBuilder: null };
}

export function calculateFeeBreakdown(fills: UserFill[]): FeeBreakdown {
  let totalFees = 0;
  let builderFees = 0;
  let totalVolume = 0;
  let firstTradeTime: number | null = null;
  let lastTradeTime: number | null = null;
  let lastBuilderAddress: string | null = null;
  let lastBuilderTime = 0;

  for (const fill of fills) {
    const fee = parseFloat(fill.fee);
    const bFee = fill.builderFee ? parseFloat(fill.builderFee) : 0;
    const notional = parseFloat(fill.px) * parseFloat(fill.sz);

    totalFees += fee;
    builderFees += bFee;
    totalVolume += notional;

    if (firstTradeTime === null || fill.time < firstTradeTime) firstTradeTime = fill.time;
    if (lastTradeTime === null || fill.time > lastTradeTime) lastTradeTime = fill.time;

    // Note: HL API doesn't return builder address in fills
  }

  return {
    totalFees,
    hlFees: totalFees - builderFees,
    builderFees,
    fillCount: fills.length,
    totalVolume,
    firstTradeTime,
    lastTradeTime,
    lastBuilderAddress,
  };
}
