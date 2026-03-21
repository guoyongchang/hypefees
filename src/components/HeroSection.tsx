import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { fetchUserFills, calculateFeeBreakdown, type FeeBreakdown, type FillProgress } from '../lib/api';
import { formatUSD, formatVolume } from '../lib/fees';
import { useLang, t } from '../lib/i18n';
import WalletProvider from './WalletProvider';
import WalletModal from './WalletModal';
import SwitchBuilder from './SwitchBuilder';
import ShareCard from './ShareCard';
import HeroFlow from './HeroFlow';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function HeroSectionInner() {
  const [lang] = useLang();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<FillProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FeeBreakdown | null>(null);

  // Wallet modal for connecting
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { address: walletAddr, isConnected } = useAccount();

  // Fill address after wallet connects (only when modal was open)
  const pendingConnect = useRef(false);
  useEffect(() => {
    if (pendingConnect.current && isConnected && walletAddr) {
      setAddress(walletAddr);
      pendingConnect.current = false;
    }
  }, [isConnected, walletAddr]);

  const handleConnectWallet = useCallback(() => {
    if (isConnected && walletAddr) {
      setAddress(walletAddr);
    } else {
      pendingConnect.current = true;
      setShowWalletModal(true);
    }
  }, [isConnected, walletAddr]);

  async function handleLookup() {
    const trimmed = address.trim();
    if (!trimmed.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError(t('result.invalidAddress', lang));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(null);
    try {
      const fills = await fetchUserFills(trimmed, setProgress);
      if (fills.length === 0) {
        setError(t('result.noHistory', lang));
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
              {t('hero.title.1', lang)}<br />{t('hero.title.2', lang)}{' '}
              <span className="text-[var(--color-accent)]">{t('hero.title.cta', lang)}</span>
            </h1>
            <p className="mt-4 text-[var(--color-text-secondary)] max-w-md leading-relaxed">
              {t('hero.subtitle', lang)}
            </p>
            <div className="mt-8">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleLookup()}
                placeholder={t('hero.input.placeholder', lang)}
                aria-label="Ethereum wallet address"
                className="w-full px-4 py-3 min-h-[44px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] font-mono text-sm"
              />
              <div className="mt-3 flex gap-3">
                <button
                  onClick={handleLookup}
                  disabled={loading}
                  aria-label="Check my builder fees"
                  className="flex-1 py-3 min-h-[44px] rounded-xl bg-[var(--color-text)] text-[var(--color-bg)] font-medium hover:opacity-85 transition-opacity disabled:opacity-50"
                >
                  {loading ? t('hero.btn.loading', lang) : t('hero.btn.lookup', lang)}
                </button>
                <button
                  onClick={handleConnectWallet}
                  className="flex-1 py-3 min-h-[44px] rounded-xl border border-[var(--color-accent)] text-[var(--color-accent)] font-medium hover:bg-[var(--color-accent-light)] transition-colors inline-flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <path d="M22 10h-6a2 2 0 0 0 0 4h6" />
                  </svg>
                  {t('hero.connectWallet', lang)}
                </button>
              </div>
              <p className="mt-3 text-[10px] text-[var(--color-text-muted)] flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-50">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {t('hero.safetyNote', lang)}
              </p>
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
              <div className="text-xs text-[var(--color-text-muted)]">{t('result.totalVolume', lang)}</div>
              <div className="text-xl font-bold mt-1 tabular-nums">{formatVolume(result.totalVolume)}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">{result.fillCount.toLocaleString()} {t('result.trades', lang)}</div>
            </div>
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] card-hover">
              <div className="text-xs text-[var(--color-text-muted)]">{t('result.totalFees', lang)}</div>
              <div className="text-xl font-bold mt-1 tabular-nums">{formatUSD(result.totalFees)}</div>
              {result.firstTradeTime && result.lastTradeTime && (
                <div className="text-xs text-[var(--color-text-muted)] mt-1">
                  {formatDate(result.firstTradeTime)} — {formatDate(result.lastTradeTime)}
                </div>
              )}
            </div>
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] card-hover">
              <div className="text-xs text-[var(--color-text-muted)]">{t('result.exchangeFees', lang)}</div>
              <div className="text-xl font-bold mt-1 tabular-nums">{formatUSD(result.hlFees)}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">{t('result.toHyperliquid', lang)}</div>
            </div>
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] card-hover">
              <div className="text-xs text-[var(--color-text-muted)]">{t('result.builderFees', lang)}</div>
              <div className={`text-xl font-bold mt-1 tabular-nums ${result.builderFees > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
                {result.builderFees > 0 ? formatUSD(result.builderFees) : '$0'}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                {result.builderFees > 0 ? `${builderPct}% ${t('result.ofTotalFees', lang)}` : t('result.noBuilderFee', lang)}
              </div>
            </div>
          </div>

          {result.totalFees > 0 && (
            <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
              <div className="text-xs text-[var(--color-text-muted)] mb-2">{t('result.feeBreakdown', lang)}</div>
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
                  {t('result.exchange', lang)} {formatUSD(result.hlFees)}
                </span>
                {result.builderFees > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-warning)]" />
                    {t('result.builder', lang)} {formatUSD(result.builderFees)}
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
                    {t('result.saveBanner', lang, { amount: formatUSD(result.builderFees) })}
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                    {t('result.saveBannerSub', lang)}
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
                {t('result.alreadyZero', lang)}
              </div>
            </div>
          )}

          {/* Shareable brag card + rank */}
          <ShareCard result={result} address={address} />

          {/* One-click switch */}
          <div className="mt-6">
            <SwitchBuilder />
          </div>
        </div>
      )}

      <WalletModal
        open={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnected={() => {
          pendingConnect.current = true;
          setShowWalletModal(false);
        }}
      />
    </div>
  );
}

export default function HeroSection() {
  return (
    <WalletProvider>
      <HeroSectionInner />
    </WalletProvider>
  );
}
