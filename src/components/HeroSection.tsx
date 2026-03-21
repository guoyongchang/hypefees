import { useState } from 'react';
import { fetchUserFills, calculateFeeBreakdown, type FeeBreakdown, type FillProgress } from '../lib/api';
import { formatUSD, formatVolume } from '../lib/fees';
import SwitchBuilder from './SwitchBuilder';
import HeroFlow from './HeroFlow';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HeroSection() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<FillProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FeeBreakdown | null>(null);

  async function handleLookup() {
    const trimmed = address.trim();
    if (!trimmed.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Please enter a valid Ethereum address (0x...)');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(null);
    try {
      const fills = await fetchUserFills(trimmed, setProgress);
      if (fills.length === 0) {
        setError('No trading history found for this address on Hyperliquid');
        setLoading(false);
        return;
      }
      setResult(calculateFeeBreakdown(fills));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  const builderPct = result && result.totalFees > 0
    ? ((result.builderFees / result.totalFees) * 100).toFixed(1)
    : '0';

  return (
    <div>
      {/* Hero: left-right split */}
      <div className="py-14 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: copy + input — staggered entrance */}
          <div className="hero-enter">
            <h1 className="text-3xl md:text-[2.75rem] font-bold tracking-tight leading-[1.15]">
              Every trade has a<br />hidden fee.{' '}
              <span className="text-[var(--color-accent)]">See yours.</span>
            </h1>
            <p className="mt-4 text-[var(--color-text-secondary)] max-w-md leading-relaxed">
              Wallets add builder fees on top of Hyperliquid's exchange rate.
              Some charge 0.10% per trade. Some charge nothing.
            </p>
            <div className="mt-8">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleLookup()}
                  placeholder="Enter your ETH address (0x...)"
                  className="flex-1 px-4 py-3 min-h-[44px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] font-mono text-sm"
                />
                <button
                  onClick={handleLookup}
                  disabled={loading}
                  className="px-6 py-3 min-h-[44px] rounded-xl bg-[var(--color-text)] text-[var(--color-bg)] font-medium hover:opacity-85 transition-opacity disabled:opacity-50 shrink-0"
                >
                  {loading ? 'Loading...' : 'Look Up'}
                </button>
              </div>
              {loading && progress && (
                <div className="mt-4 flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                  <div className="h-4 w-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                  {progress.status} ({progress.loaded.toLocaleString()} trades loaded)
                </div>
              )}
              {error && (
                <div className="mt-4 p-3 rounded-xl bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right: flow animation */}
          <div className="hidden lg:block">
            <HeroFlow />
          </div>
        </div>
      </div>

      {/* Results: full width, below hero */}
      {result && (
        <div className="pb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] card-hover">
              <div className="text-xs text-[var(--color-text-muted)]">Total Volume</div>
              <div className="text-xl font-bold mt-1 tabular-nums">{formatVolume(result.totalVolume)}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">{result.fillCount.toLocaleString()} trades</div>
            </div>
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] card-hover">
              <div className="text-xs text-[var(--color-text-muted)]">Total Fees</div>
              <div className="text-xl font-bold mt-1 tabular-nums">{formatUSD(result.totalFees)}</div>
              {result.firstTradeTime && result.lastTradeTime && (
                <div className="text-xs text-[var(--color-text-muted)] mt-1">
                  {formatDate(result.firstTradeTime)} — {formatDate(result.lastTradeTime)}
                </div>
              )}
            </div>
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] card-hover">
              <div className="text-xs text-[var(--color-text-muted)]">Exchange Fees</div>
              <div className="text-xl font-bold mt-1 tabular-nums">{formatUSD(result.hlFees)}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">To Hyperliquid</div>
            </div>
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] card-hover">
              <div className="text-xs text-[var(--color-text-muted)]">Builder Fees</div>
              <div className={`text-xl font-bold mt-1 tabular-nums ${result.builderFees > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
                {result.builderFees > 0 ? formatUSD(result.builderFees) : '$0'}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                {result.builderFees > 0 ? `${builderPct}% of total fees` : 'No builder fee paid'}
              </div>
            </div>
          </div>

          {result.totalFees > 0 && (
            <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
              <div className="text-xs text-[var(--color-text-muted)] mb-2">Fee Breakdown</div>
              <div className="h-3 rounded-full overflow-hidden flex bg-[var(--color-bg-elevated)]">
                <div
                  className="bg-[var(--color-accent)] transition-all duration-500"
                  style={{ width: `${((result.hlFees / result.totalFees) * 100)}%` }}
                />
                {result.builderFees > 0 && (
                  <div
                    className="bg-[var(--color-warning)] transition-all duration-500"
                    style={{ width: `${((result.builderFees / result.totalFees) * 100)}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between mt-2 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)]" />
                  Exchange {formatUSD(result.hlFees)}
                </span>
                {result.builderFees > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-warning)]" />
                    Builder {formatUSD(result.builderFees)}
                  </span>
                )}
              </div>
            </div>
          )}

          {result.builderFees > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-[var(--color-success-bg)] border border-[var(--color-success)]/20">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-[var(--color-success)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-[var(--color-success)]">
                    You could have saved {formatUSD(result.builderFees)} with a 0% fee builder
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                    Switch to a builder with 0% fees to keep more of your profits on future trades.
                  </div>
                </div>
              </div>
            </div>
          )}

          {result.builderFees === 0 && result.totalFees > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-[var(--color-success-bg)] border border-[var(--color-success)]/20">
              <div className="flex items-center gap-2 text-[var(--color-success)] font-medium">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                You're already on a 0% fee builder — nicely done!
              </div>
            </div>
          )}

          <div className="mt-8">
            <SwitchBuilder />
          </div>
        </div>
      )}
    </div>
  );
}
