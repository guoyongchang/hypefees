import { useState, useEffect, useMemo } from 'react';
import type { Builder } from '../lib/fees';
import { VIP_TIERS, calculateFees, formatUSD, formatFeePercent } from '../lib/fees';

const VOLUME_MIN = 10_000;
const VOLUME_MAX = 100_000_000;

// Known builder display names
const BUILDER_NAMES: Record<string, string> = {
  '1KREF': 'OneKey',
};

function getBuilderName(builder: Builder): string {
  if (builder.refCode && BUILDER_NAMES[builder.refCode]) return BUILDER_NAMES[builder.refCode];
  if (builder.refCode) return builder.refCode;
  return `${builder.address.slice(0, 6)}...${builder.address.slice(-4)}`;
}

function volumeFromSlider(value: number): number {
  // Logarithmic scale: 0-100 maps to 10K-100M
  const logMin = Math.log10(VOLUME_MIN);
  const logMax = Math.log10(VOLUME_MAX);
  return Math.round(Math.pow(10, logMin + (value / 100) * (logMax - logMin)));
}

function sliderFromVolume(volume: number): number {
  const logMin = Math.log10(VOLUME_MIN);
  const logMax = Math.log10(VOLUME_MAX);
  return ((Math.log10(volume) - logMin) / (logMax - logMin)) * 100;
}

export default function FeeSimulator() {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [sliderValue, setSliderValue] = useState(50); // mid-point ~$1M
  const [volumeInput, setVolumeInput] = useState('');
  const [vipTier, setVipTier] = useState(0);
  const volume = volumeFromSlider(sliderValue);

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
    // Direct HL (no builder fee)
    const direct = calculateFees(volume, 0, vipTier);

    // Each builder
    const results = builders.map((b) => {
      const fees = calculateFees(volume, b.usageFee, vipTier);
      return {
        name: getBuilderName(b),
        builderFee: b.usageFee,
        total: fees.total,
        hlFee: fees.hlFee,
        builderTotal: fees.builderTotal,
        savings: fees.total - direct.total,
      };
    });

    results.sort((a, b) => a.total - b.total);
    return { direct, results };
  }, [builders, volume, vipTier]);

  const maxFee = simResults.results.length > 0
    ? Math.max(...simResults.results.map((r) => r.total))
    : 0;

  return (
    <div>
      {/* Volume slider */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
          Simulated Trading Volume
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
        <div className="flex items-center gap-3 mt-3">
          <span className="text-sm text-[var(--color-text-secondary)]">$</span>
          <input
            type="text"
            value={volumeInput}
            onChange={(e) => handleVolumeInput(e.target.value)}
            className="w-40 px-3 py-2.5 min-h-[44px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <select
            value={vipTier}
            onChange={(e) => setVipTier(parseInt(e.target.value))}
            className="px-3 py-2.5 min-h-[44px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            {VIP_TIERS.map((t) => (
              <option key={t.tier} value={t.tier}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2">
        {/* Direct HL baseline */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
          <div className="w-36 text-sm font-medium truncate">Direct HL</div>
          <div className="flex-1">
            <div
              className="h-6 rounded bg-[var(--color-accent)]/20 flex items-center"
              style={{ width: maxFee > 0 ? `${(simResults.direct.total / maxFee) * 100}%` : '0%', minWidth: '2rem' }}
            >
              <span className="px-2 text-xs font-medium tabular-nums">{formatUSD(simResults.direct.total)}</span>
            </div>
          </div>
          <div className="w-24 text-right text-xs text-[var(--color-text-muted)]">Baseline</div>
        </div>

        {simResults.results.slice(0, 15).map((r, i) => (
          <div
            key={r.name}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              r.builderFee === 0
                ? 'bg-[var(--color-success-bg)] border-[var(--color-success)]/30'
                : 'bg-[var(--color-bg-card)] border-[var(--color-border)]'
            }`}
          >
            <div className="w-36 text-sm font-medium truncate">{r.name}</div>
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
            <div className={`w-24 text-right text-xs tabular-nums ${r.savings > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
              {r.savings > 0 ? `+${formatUSD(r.savings)}` : 'Best'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
