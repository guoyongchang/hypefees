import { useState } from 'react';
import { fetchUserFills, calculateFeeBreakdown, type FeeBreakdown } from '../lib/api';
import { formatUSD } from '../lib/fees';

export default function AddressLookup() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FeeBreakdown | null>(null);

  async function handleLookup() {
    const trimmed = address.trim();
    if (!trimmed.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fills = await fetchUserFills(trimmed);
      if (fills.length === 0) {
        setError('No trading history found for this address');
        setLoading(false);
        return;
      }
      const breakdown = calculateFeeBreakdown(fills);
      setResult(breakdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  const savingsEstimate = result ? result.builderFees : 0;

  return (
    <div>
      <div className="flex gap-3">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          placeholder="0x..."
          className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] font-mono text-sm"
        />
        <button
          onClick={handleLookup}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Look Up'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
            <div className="text-sm text-[var(--color-text-secondary)]">Total Fees Paid</div>
            <div className="text-2xl font-bold mt-1 tabular-nums">{formatUSD(result.totalFees)}</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">{result.fillCount.toLocaleString()} trades</div>
          </div>
          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
            <div className="text-sm text-[var(--color-text-secondary)]">To Hyperliquid</div>
            <div className="text-2xl font-bold mt-1 tabular-nums">{formatUSD(result.hlFees)}</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">Exchange fees</div>
          </div>
          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
            <div className="text-sm text-[var(--color-text-secondary)]">To Builders</div>
            <div className="text-2xl font-bold mt-1 tabular-nums text-[var(--color-warning)]">{formatUSD(result.builderFees)}</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">Extra builder fees</div>
          </div>

          {savingsEstimate > 0 && (
            <div className="col-span-full p-4 rounded-xl bg-[var(--color-success-bg)] border border-[var(--color-success)]/30">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="text-[var(--color-success)] font-medium">
                  You could have saved {formatUSD(savingsEstimate)} by using a 0% fee builder
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
