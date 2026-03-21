import { useState, useEffect, useMemo } from 'react';
import type { Builder } from '../lib/fees';
import { formatFeePercent, totalTakerFee, totalMakerFee, formatVolume } from '../lib/fees';
import builderIcons from '../data/builder-icons.json';
import curatedData from '../data/curated-builders.json';

type SortKey = 'default' | 'usageFee' | 'users' | 'volume' | 'totalTaker';
type SortDir = 'asc' | 'desc';
type ViewMode = 'featured' | 'all';

const ICONS: Record<string, string> = builderIcons;

interface CuratedInfo {
  order: number;
  type: string;
  featured: boolean;
  platforms: { ios: boolean; android: boolean; desktop: boolean; extension: boolean; web: boolean };
  hardware: string;
  url: string | null;
}

const CURATED: Record<string, CuratedInfo> = {};
for (const b of curatedData.builders) {
  CURATED[b.refCode] = b as CuratedInfo;
}

const TYPE_LABELS: Record<string, string> = {
  wallet: 'Wallet',
  terminal: 'Terminal',
  platform: 'Platform',
  frontend: 'Frontend',
  bot: 'Bot',
};

function PlatformBadge({ active, label, title }: { active: boolean; label: string; title: string }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center justify-center w-6 h-5 rounded text-[10px] font-medium leading-none ${
        active
          ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
          : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] opacity-40'
      }`}
    >
      {label}
    </span>
  );
}

function HardwareBadge({ hardware }: { hardware: string }) {
  if (hardware === 'none') return <span className="text-[var(--color-text-muted)] text-xs opacity-40">—</span>;
  if (hardware === 'own') return <span className="text-xs font-medium text-[var(--color-accent)]" title="Own hardware wallet (OneKey Classic, Pro, Touch, Mini)">Own HW</span>;
  const parts: string[] = [];
  if (hardware.includes('ledger')) parts.push('Ledger');
  if (hardware.includes('trezor')) parts.push('Trezor');
  if (hardware.includes('onekey')) parts.push('OneKey');
  if (parts.length > 0) return <span className="text-xs text-[var(--color-text-secondary)]" title={`Supports ${parts.join(', ')}`}>{parts.join(' · ')}</span>;
  return <span className="text-xs text-[var(--color-text-muted)]">{hardware}</span>;
}

export default function BuilderTable() {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('featured');

  useEffect(() => {
    fetch('/api/builders')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setBuilders(data.builders ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (viewMode === 'featured') {
      return builders.filter((b) => b.refCode && CURATED[b.refCode]?.featured);
    }
    return builders;
  }, [builders, viewMode]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sortKey === 'default') {
      // Default: use curated order for featured, then by volume for the rest
      copy.sort((a, b) => {
        const oa = a.refCode && CURATED[a.refCode] ? CURATED[a.refCode].order : 999;
        const ob = b.refCode && CURATED[b.refCode] ? CURATED[b.refCode].order : 999;
        if (oa !== ob) return oa - ob;
        return b.volume - a.volume; // fallback: higher volume first
      });
    } else {
      copy.sort((a, b) => {
        let va: number, vb: number;
        switch (sortKey) {
          case 'usageFee': va = a.usageFee; vb = b.usageFee; break;
          case 'users': va = a.users; vb = b.users; break;
          case 'volume': va = a.volume; vb = b.volume; break;
          case 'totalTaker': va = totalTakerFee(a.usageFee); vb = totalTakerFee(b.usageFee); break;
          default: va = a.usageFee; vb = b.usageFee;
        }
        return sortDir === 'asc' ? va - vb : vb - va;
      });
    }
    return copy;
  }, [filtered, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === 'default') return;
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'usageFee' || key === 'totalTaker' ? 'asc' : 'desc');
    }
  }

  const isDefault = sortKey === 'default';

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => (
    <span className={`ml-1 inline-block ${active && !isDefault ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
      {active && !isDefault ? (dir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] px-4 py-3 flex gap-12">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-4 w-16 bg-[var(--color-border)] rounded animate-pulse" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 border-b border-[var(--color-border)] last:border-0 flex gap-12">
            {Array.from({ length: 7 }).map((_, j) => (
              <div key={j} className="h-4 w-14 bg-[var(--color-border)]/50 rounded animate-pulse" style={{ animationDelay: `${(i * 7 + j) * 40}ms` }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-16 text-[var(--color-danger)]">Failed to load: {error}</div>;
  }

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setViewMode('featured')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[36px] ${
            viewMode === 'featured'
              ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          Top Wallets
        </button>
        <button
          onClick={() => setViewMode('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[36px] ${
            viewMode === 'all'
              ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          All Builders ({builders.length})
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)]">Builder</th>
              <th
                className="px-4 py-3 font-medium text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)] select-none text-left"
                onClick={() => handleSort('usageFee')}
              >
                Builder Fee <SortIcon active={sortKey === 'usageFee'} dir={sortDir} />
              </th>
              <th
                className="px-4 py-3 font-medium text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)] select-none text-left"
                onClick={() => handleSort('totalTaker')}
              >
                Eff. Taker <SortIcon active={sortKey === 'totalTaker'} dir={sortDir} />
              </th>
              {viewMode === 'featured' && (
                <>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)] text-center">Platforms</th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)] text-center">Hardware</th>
                </>
              )}
              <th
                className="px-4 py-3 font-medium text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)] select-none text-right"
                onClick={() => handleSort('users')}
              >
                Users <SortIcon active={sortKey === 'users'} dir={sortDir} />
              </th>
              <th
                className="px-4 py-3 font-medium text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)] select-none text-right"
                onClick={() => handleSort('volume')}
              >
                Volume <SortIcon active={sortKey === 'volume'} dir={sortDir} />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((builder) => {
              const isZeroFee = builder.usageFee === 0;
              const curated = builder.refCode ? CURATED[builder.refCode] : undefined;
              const icon = builder.refCode ? ICONS[builder.refCode] : null;

              return (
                <tr
                  key={builder.address}
                  className={`border-b border-[var(--color-border)] last:border-0 transition-colors hover:bg-[var(--color-bg-secondary)] ${isZeroFee ? 'bg-[var(--color-success-bg)]' : ''}`}
                >
                  {/* Builder name + icon + type */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {icon ? (
                        <img src={icon} alt="" width={22} height={22} className="rounded-full shrink-0" loading="lazy" />
                      ) : (
                        <div className="w-[22px] h-[22px] rounded-full bg-[var(--color-bg-elevated)] shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium truncate">{builder.refCode || `${builder.address.slice(0, 6)}...`}</span>
                          {isZeroFee && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-success)] text-white font-medium shrink-0">
                              Best
                            </span>
                          )}
                        </div>
                        {curated && (
                          <span className="text-[10px] text-[var(--color-text-muted)]">
                            {TYPE_LABELS[curated.type] || curated.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Builder Fee */}
                  <td className={`px-4 py-3 tabular-nums ${isZeroFee ? 'text-[var(--color-success)] font-semibold' : ''}`}>
                    {builder.usageFee === 0 ? 'FREE' : formatFeePercent(builder.usageFee)}
                  </td>

                  {/* Effective Taker */}
                  <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">
                    {formatFeePercent(totalTakerFee(builder.usageFee))}
                  </td>

                  {/* Platforms (featured view only) */}
                  {viewMode === 'featured' && curated && (
                    <>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-0.5">
                          <PlatformBadge active={curated.platforms.ios} label="iOS" title="iOS App" />
                          <PlatformBadge active={curated.platforms.android} label="And" title="Android App" />
                          <PlatformBadge active={curated.platforms.desktop} label="Mac" title="Desktop App" />
                          <PlatformBadge active={curated.platforms.extension} label="Ext" title="Browser Extension" />
                          <PlatformBadge active={curated.platforms.web} label="Web" title="Web App" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <HardwareBadge hardware={curated.hardware} />
                      </td>
                    </>
                  )}
                  {viewMode === 'featured' && !curated && (
                    <>
                      <td className="px-4 py-3 text-center text-[var(--color-text-muted)] text-xs">—</td>
                      <td className="px-4 py-3 text-center text-[var(--color-text-muted)] text-xs">—</td>
                    </>
                  )}

                  {/* Users */}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {builder.users.toLocaleString()}
                  </td>

                  {/* Volume */}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatVolume(builder.volume)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-[var(--color-text-muted)]">
        {viewMode === 'featured'
          ? `Showing ${sorted.length} top wallets and frontends. Switch to "All Builders" to see all ${builders.length}.`
          : `${sorted.length} builders tracked. Data from HyperTracker.`
        }
      </p>
    </div>
  );
}
