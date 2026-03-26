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

// ── Request queue & resume ───────────────────────────────────────────────────

interface ResumeEntry {
  fills: UserFill[];
  seen: Set<number>;
  nextStartTime: number;
  ts: number;
}

/**
 * Partial-progress cache: saves state after each page so a rate-limited fetch
 * can resume from where it left off instead of restarting from time=0.
 * Expires after 30 minutes.
 */
const resumeCache = new Map<string, ResumeEntry>();
const RESUME_TTL_MS = 30 * 60 * 1000;

/** Dedup map: prevents duplicate in-flight requests for the same address */
const inFlight = new Map<string, Promise<UserFill[]>>();

/** Queue tail: serialises concurrent requests so the API isn't hammered */
let queueTail: Promise<unknown> = Promise.resolve();

// ────────────────────────────────────────────────────────────────────────────

/**
 * Fetch ALL user fills using userFillsByTime for complete history.
 * Concurrent requests for the same address share a single in-flight promise;
 * requests for different addresses are serialised through a queue to avoid
 * rate-limit bursts. Interrupted fetches resume from where they left off.
 */
export async function fetchUserFills(
  address: string,
  onProgress?: (progress: FillProgress) => void,
): Promise<UserFill[]> {
  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error('Invalid Ethereum address');
  }

  const key = address.toLowerCase();

  // 1. In-flight dedup — same address already being fetched; share the promise
  const existing = inFlight.get(key);
  if (existing) {
    onProgress?.({ loaded: 0, status: 'Waiting for in-progress fetch...' });
    return existing;
  }

  // 2. Enqueue — wait for the previous request to finish before starting
  //    This serialises API calls and prevents rate-limit spikes.
  let resolveRequest!: (v: UserFill[]) => void;
  let rejectRequest!: (e: unknown) => void;
  const request = new Promise<UserFill[]>((res, rej) => {
    resolveRequest = res;
    rejectRequest = rej;
  });

  const prev = queueTail;
  const queued = prev.then(async () => {
    try {
      const fills = await doFetchUserFills(address, onProgress);
      resolveRequest(fills);
    } catch (err) {
      rejectRequest(err);
    }
  });
  // Advance queue tail regardless of success/failure
  queueTail = queued.then(() => {}, () => {});

  inFlight.set(key, request);
  request.finally(() => inFlight.delete(key));

  return request;
}

/** Internal: performs the actual paginated fetch with retry/backoff.
 *  Resumes from resumeCache if a previous attempt was interrupted. */
async function doFetchUserFills(
  address: string,
  onProgress?: (progress: FillProgress) => void,
): Promise<UserFill[]> {
  const key = address.toLowerCase();

  // Resume from a previous interrupted fetch if available and fresh
  const resume = resumeCache.get(key);
  const canResume = !!resume && Date.now() - resume.ts < RESUME_TTL_MS;

  const allFills: UserFill[] = canResume ? [...resume.fills] : [];
  const seen: Set<number> = canResume ? new Set(resume.seen) : new Set<number>();
  let startTime = canResume ? resume.nextStartTime : 0;

  if (canResume) {
    onProgress?.({ loaded: allFills.length, status: `Resuming from ${allFills.length.toLocaleString()} trades...` });
  }

  while (true) {
    onProgress?.({ loaded: allFills.length, status: `Loading trades...` });

    let res: Response | null = null;
    for (let attempt = 0; attempt < 8; attempt++) {
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
      // Exponential backoff capped at 60s: 1s, 2s, 4s, 8s, 16s, 32s, 60s, 60s
      const wait = Math.min(Math.pow(2, attempt) * 1000, 60_000);
      onProgress?.({ loaded: allFills.length, status: `Rate limited, retrying in ${wait / 1000}s...` });
      await new Promise((r) => setTimeout(r, wait));
    }

    if (!res || !res.ok) {
      // Save progress so the next attempt can resume from here
      resumeCache.set(key, { fills: allFills, seen, nextStartTime: startTime, ts: Date.now() });
      throw new Error(res?.status === 429 ? 'Hyperliquid API rate limit — please try again in a minute' : `Failed to fetch fills: ${res?.status}`);
    }

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

    // Save progress after each successful page so we can resume on failure
    resumeCache.set(key, { fills: allFills, seen, nextStartTime: startTime, ts: Date.now() });

    // Small delay between pages to avoid rate limiting
    await new Promise((r) => setTimeout(r, 200));
  }

  // Fetch complete — clear the resume checkpoint so next query starts fresh
  resumeCache.delete(key);
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
