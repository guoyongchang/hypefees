import { useState, useEffect, useMemo } from 'react';
import type { Builder } from '../lib/fees';
import { VIP_TIERS, STAKING_TIERS, calculateFees, formatUSD, formatFeePercent } from '../lib/fees';
import { useLang, t } from '../lib/i18n';
import builderIcons from '../data/builder-icons.json';
import { track, Events } from '../lib/analytics';

const VOLUME_MIN = 10_000;
const VOLUME_MAX = 100_000_000;
const ICONS: Record<string, string> = builderIcons;

// OneKey is always shown first with 0% fee
const ONEKEY_BUILDER: Builder = {
  refCode: 'OneKey',
  address: '0x9b12e858da780a96876e3018780cf0d83359b0bb',
  usageFee: 0,
  users: 0,
  volume: 0,
  revenue: 0,
};

function getBuilderName(builder: Builder): string {
  if (builder.refCode) return builder.refCode;
  return `${builder.address.slice(0, 6)}...${builder.address.slice(-4)}`;
}

function getBuilderIcon(name: string): string | null {
  return ICONS[name] || null;
}

function volumeFromSlider(value: number): number {
  const logMin = Math.log10(VOLUME_MIN);
  const logMax = Math.log10(VOLUME_MAX);
  return Math.round(Math.pow(10, logMin + (value / 100) * (logMax - logMin)));
}

function sliderFromVolume(volume: number): number {
  const logMin = Math.log10(VOLUME_MIN);
  const logMax = Math.log10(VOLUME_MAX);
  return ((Math.log10(volume) - logMin) / (logMax - logMin)) * 100;
}

function formatStake(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function FeeSimulator() {
  const [lang] = useLang();
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [sliderValue, setSliderValue] = useState(50);
  const [volumeInput, setVolumeInput] = useState('');
  const [vipTier, setVipTier] = useState(0);
  const [stakingTier, setStakingTier] = useState(0);
  const volume = volumeFromSlider(sliderValue);
  const stakingDiscount = STAKING_TIERS[stakingTier]?.discount ?? 0;

  useEffect(() => {
    fetch('/api/builders')
      .then((r) => r.json())
      .then((d) => setBuilders(d.builders ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setVolumeInput(volume.toLocaleString());
  }, [volume]);

  function handleVolumeInput(val: string) {
    setVolumeInput(val);
    const num = parseInt(val.replace(/[,\s$]/g, ''), 10);
    if (!isNaN(num) && num >= VOLUME_MIN && num <= VOLUME_MAX) {
      setSliderValue(sliderFromVolume(num));
    }
  }

  const simResults = useMemo(() => {
    const direct = calculateFees(volume, 0, vipTier);
    // Apply staking discount
    const applyDiscount = (fees: { total: number; hlFee: number; builderTotal: number }) => ({
      total: fees.total * (1 - stakingDiscount) + fees.builderTotal * stakingDiscount, // discount only applies to HL fees
      hlFee: fees.hlFee * (1 - stakingDiscount),
      builderTotal: fees.builderTotal,
    });

    const directDiscounted = {
      total: direct.hlFee * (1 - stakingDiscount) + direct.builderTotal,
      hlFee: direct.hlFee * (1 - stakingDiscount),
      builderTotal: direct.builderTotal,
    };

    // Ensure OneKey is always first, then top 15 by volume (deduplicated)
    const topBuilders = [...builders]
      .filter((b) => b.refCode !== 'OneKey')
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 14);

    const allBuilders = [ONEKEY_BUILDER, ...topBuilders];

    const results = allBuilders.map((b) => {
      const fees = calculateFees(volume, b.usageFee, vipTier);
      const discountedHl = fees.hlFee * (1 - stakingDiscount);
      const total = discountedHl + fees.builderTotal;
      return {
        name: getBuilderName(b),
        builderFee: b.usageFee,
        total,
        hlFee: discountedHl,
        builderTotal: fees.builderTotal,
        savings: total - directDiscounted.total,
      };
    });

    results.sort((a, b) => a.total - b.total);
    return { direct: directDiscounted, results };
  }, [builders, volume, vipTier, stakingDiscount]);

  const maxFee = simResults.results.length > 0
    ? Math.max(...simResults.results.map((r) => r.total))
    : 0;

  return (
    <div>
      {/* Volume slider */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
          {t('sim.volume', lang)}
        </label>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[var(--color-text-muted)]">$10K</span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={sliderValue}
            onChange={(e) => setSliderValue(parseFloat(e.target.value))}
            className="flex-1 accent-[var(--color-accent)]"
          />
          <span className="text-xs text-[var(--color-text-muted)]">$100M</span>
        </div>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <span className="text-sm text-[var(--color-text-secondary)]">$</span>
          <input
            type="text"
            value={volumeInput}
            onChange={(e) => handleVolumeInput(e.target.value)}
            className="w-40 px-3 py-2.5 min-h-[44px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <select
            value={vipTier}
            onChange={(e) => { setVipTier(parseInt(e.target.value)); track(Events.FEE_CALCULATOR_USED, { volume, vip_tier: parseInt(e.target.value), staking_tier: stakingTier }); }}
            className="px-3 py-2.5 min-h-[44px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            {VIP_TIERS.map((t) => (
              <option key={t.tier} value={t.tier}>
                {t.label} {t.minVolume > 0 ? `(≥$${formatStake(t.minVolume)} vol)` : ''}
              </option>
            ))}
          </select>
          <select
            value={stakingTier}
            onChange={(e) => { setStakingTier(parseInt(e.target.value)); track(Events.FEE_CALCULATOR_USED, { volume, vip_tier: vipTier, staking_tier: parseInt(e.target.value) }); }}
            className="px-3 py-2.5 min-h-[44px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            {STAKING_TIERS.map((t, i) => (
              <option key={i} value={i}>
                {t.name === 'None'
                  ? 'No Staking'
                  : `${t.name} (≥${formatStake(t.minStake)} HYPE · -${Math.round(t.discount * 100)}%)`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2">
        {/* Direct HL baseline */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
          <div className="w-24 sm:w-36 text-xs sm:text-sm font-medium truncate">{t('sim.directHL', lang)}</div>
          <div className="flex-1">
            <div
              className="h-6 rounded bg-[var(--color-accent)]/20 flex items-center"
              style={{ width: maxFee > 0 ? `${(simResults.direct.total / maxFee) * 100}%` : '0%', minWidth: '2rem' }}
            >
              <span className="px-2 text-xs font-medium tabular-nums">{formatUSD(simResults.direct.total)}</span>
            </div>
          </div>
          <div className="w-16 sm:w-24 text-right text-xs text-[var(--color-text-muted)]">{t('sim.baseline', lang)}</div>
        </div>

        {simResults.results.slice(0, 15).map((r) => (
          <div
            key={r.name}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              r.builderFee === 0
                ? 'bg-[var(--color-success-bg)] border-[var(--color-success)]/30'
                : 'bg-[var(--color-bg-card)] border-[var(--color-border)]'
            }`}
          >
            <div className="w-24 sm:w-36 text-xs sm:text-sm font-medium truncate flex items-center gap-1.5">
              {getBuilderIcon(r.name) ? (
                <img src={getBuilderIcon(r.name)!} alt="" width={16} height={16} className="rounded-full shrink-0" loading="lazy" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-[var(--color-bg-elevated)] shrink-0" />
              )}
              {r.name}
            </div>
            <div className="flex-1">
              <div
                className={`h-6 rounded flex items-center ${
                  r.builderFee === 0 ? 'bg-[var(--color-success)]/20' : 'bg-[var(--color-warning)]/20'
                }`}
                style={{ width: maxFee > 0 ? `${(r.total / maxFee) * 100}%` : '0%', minWidth: '2rem' }}
              >
                <span className="px-2 text-xs font-medium tabular-nums">{formatUSD(r.total)}</span>
              </div>
            </div>
            <div className={`w-16 sm:w-24 text-right text-xs tabular-nums ${r.savings > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
              {r.savings > 0 ? `+${formatUSD(r.savings)}` : t('sim.best', lang)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
