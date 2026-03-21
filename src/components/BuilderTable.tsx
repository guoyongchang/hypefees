import { useState, useEffect, useMemo } from 'react';
import type { Builder } from '../lib/fees';
import { formatFeePercent, totalTakerFee, totalMakerFee, formatVolume } from '../lib/fees';
import { useLang, t } from '../lib/i18n';
import type { Lang } from '../lib/i18n';
import builderIcons from '../data/builder-icons.json';
import curatedData from '../data/curated-builders.json';
import { track, Events } from '../lib/analytics';

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

function getTypeLabel(type: string | undefined, lang: Lang): string {
  if (!type) return '';
  const map: Record<string, string> = {
    wallet: t('table.wallet', lang),
    terminal: t('table.terminal', lang),
    platform: t('table.platform', lang),
    frontend: t('table.frontend', lang),
    bot: t('table.bot', lang),
  };
  return map[type] || type;
}

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

function HardwareBadge({ hardware, lang }: { hardware: string; lang: Lang }) {
  if (hardware === 'none') return <span className="text-[var(--color-text-muted)] text-xs opacity-40">—</span>;
  if (hardware === 'own') return <span className="text-xs font-medium text-[var(--color-accent)]" title="Own hardware wallet (OneKey Classic, Pro, Touch, Mini)">{t('table.ownHW', lang)}</span>;
  const parts: string[] = [];
  if (hardware.includes('ledger')) parts.push('Ledger');
  if (hardware.includes('trezor')) parts.push('Trezor');
  if (hardware.includes('onekey')) parts.push('OneKey');
  if (parts.length > 0) return <span className="text-xs text-[var(--color-text-secondary)]" title={`${t('table.supports', lang)} ${parts.join(', ')}`}>{parts.join(' · ')}</span>;
  return <span className="text-xs text-[var(--color-text-muted)]">{hardware}</span>;
}

export default function BuilderTable() {
  const [lang] = useLang();
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('featured');
  const [search, setSearch] = useState('');

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
    let list = viewMode === 'featured'
      ? builders.filter((b) => b.refCode && CURATED[b.refCode]?.featured)
      : builders;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) => b.refCode?.toLowerCase().includes(q));
    }

    return list;
  }, [builders, viewMode, search]);

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
      const newDir = sortDir === 'asc' ? 'desc' : 'asc';
      setSortDir(newDir);
      track(Events.BUILDER_TABLE_SORTED, { sort_key: key, sort_dir: newDir });
    } else {
      const newDir = key === 'usageFee' || key === 'totalTaker' ? 'asc' : 'desc';
      setSortKey(key);
      setSortDir(newDir);
      track(Events.BUILDER_TABLE_SORTED, { sort_key: key, sort_dir: newDir });
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
    return <div className="text-center py-16 text-[var(--color-warning)]">{t('table.failedToLoad', lang)} {error}</div>;
  }

  return (
    <div>
      {/* View toggle + search */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => { setViewMode('featured'); setSearch(''); track(Events.BUILDER_TABLE_VIEW_CHANGED, { view_mode: 'featured' }); }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[36px] ${
            viewMode === 'featured' && !search
              ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          {t('table.topWallets', lang)}
        </button>
        <button
          onClick={() => { setViewMode('all'); setSearch(''); track(Events.BUILDER_TABLE_VIEW_CHANGED, { view_mode: 'all' }); }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[36px] ${
            viewMode === 'all' || search
              ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          {t('table.allBuilders', lang)} ({builders.length})
        </button>
        <div className="relative w-full sm:w-auto sm:ml-auto">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); if (e.target.value && viewMode === 'featured') setViewMode('all'); if (e.target.value.length >= 2) { clearTimeout((window as any).__searchTrackTimer); (window as any).__searchTrackTimer = setTimeout(() => { track(Events.BUILDER_TABLE_SEARCHED, { query: e.target.value }); }, 1000); } }}
            placeholder={t('table.search', lang)}
            className="pl-9 pr-3 py-1.5 min-h-[36px] w-full sm:w-48 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)]">{t('table.builder', lang)}</th>
              <th
                className="px-4 py-3 font-medium text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)] select-none text-left"
                onClick={() => handleSort('usageFee')}
              >
                {t('table.builderFee', lang)} <SortIcon active={sortKey === 'usageFee'} dir={sortDir} />
              </th>
              <th
                className="px-4 py-3 font-medium text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)] select-none text-left"
                onClick={() => handleSort('totalTaker')}
              >
                {t('table.effTaker', lang)} <SortIcon active={sortKey === 'totalTaker'} dir={sortDir} />
              </th>
              {viewMode === 'featured' && (
                <>
                  <th className="hidden md:table-cell px-4 py-3 font-medium text-[var(--color-text-secondary)] text-center">{t('table.platforms', lang)}</th>
                  <th className="hidden md:table-cell px-4 py-3 font-medium text-[var(--color-text-secondary)] text-center">{t('table.hardware', lang)}</th>
                </>
              )}
              <th
                className="hidden sm:table-cell px-4 py-3 font-medium text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)] select-none text-right"
                onClick={() => handleSort('users')}
              >
                {t('table.users', lang)} <SortIcon active={sortKey === 'users'} dir={sortDir} />
              </th>
              <th
                className="hidden sm:table-cell px-4 py-3 font-medium text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)] select-none text-right"
                onClick={() => handleSort('volume')}
              >
                {t('table.volume', lang)} <SortIcon active={sortKey === 'volume'} dir={sortDir} />
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
                      {curated?.url ? (
                        <a href={curated.url} target="_blank" rel="noopener noreferrer" className="shrink-0 hover:opacity-80 transition-opacity">
                          {icon ? (
                            <img src={icon} alt={builder.refCode || ''} width={22} height={22} className="rounded-full" loading="lazy" />
                          ) : (
                            <div className="w-[22px] h-[22px] rounded-full bg-[var(--color-bg-elevated)]" />
                          )}
                        </a>
                      ) : icon ? (
                        <img src={icon} alt="" width={22} height={22} className="rounded-full shrink-0" loading="lazy" />
                      ) : (
                        <div className="w-[22px] h-[22px] rounded-full bg-[var(--color-bg-elevated)] shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium truncate">{builder.refCode || `${builder.address.slice(0, 6)}...`}</span>
                          {isZeroFee && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--color-success)] text-[var(--color-success)] font-semibold shrink-0">
                              {t('table.best', lang)}
                            </span>
                          )}
                        </div>
                        {curated && (
                          <span className="text-[10px] text-[var(--color-text-muted)]">
                            {getTypeLabel(curated.type, lang)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Builder Fee */}
                  <td className={`px-4 py-3 tabular-nums ${isZeroFee ? 'text-[var(--color-success)] font-semibold' : ''}`}>
                    {builder.usageFee === 0 ? t('table.free', lang) : formatFeePercent(builder.usageFee)}
                  </td>

                  {/* Effective Taker */}
                  <td className="px-4 py-3 tabular-nums text-[var(--color-text-secondary)]">
                    {formatFeePercent(totalTakerFee(builder.usageFee))}
                  </td>

                  {/* Platforms (featured, hidden on mobile) */}
                  {viewMode === 'featured' && curated && (
                    <>
                      <td className="hidden md:table-cell px-4 py-3">
                        <div className="flex items-center justify-center gap-0.5">
                          <PlatformBadge active={curated.platforms.ios} label="iOS" title={t('table.iOSApp', lang)} />
                          <PlatformBadge active={curated.platforms.android} label="And" title={t('table.androidApp', lang)} />
                          <PlatformBadge active={curated.platforms.desktop} label="Mac" title={t('table.desktopApp', lang)} />
                          <PlatformBadge active={curated.platforms.extension} label="Ext" title={t('table.browserExt', lang)} />
                          <PlatformBadge active={curated.platforms.web} label="Web" title={t('table.webApp', lang)} />
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-center">
                        <HardwareBadge hardware={curated.hardware} lang={lang} />
                      </td>
                    </>
                  )}
                  {viewMode === 'featured' && !curated && (
                    <>
                      <td className="hidden md:table-cell px-4 py-3 text-center text-[var(--color-text-muted)] text-xs">—</td>
                      <td className="hidden md:table-cell px-4 py-3 text-center text-[var(--color-text-muted)] text-xs">—</td>
                    </>
                  )}

                  {/* Users (hidden on small mobile) */}
                  <td className="hidden sm:table-cell px-4 py-3 text-right tabular-nums">
                    {builder.users.toLocaleString()}
                  </td>

                  {/* Volume (hidden on small mobile) */}
                  <td className="hidden sm:table-cell px-4 py-3 text-right tabular-nums">
                    {formatVolume(builder.volume)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sorted.length === 0 && search && (
          <div className="text-center py-12 text-[var(--color-text-muted)] text-sm">
            {t('table.noResults', lang, { q: search })}
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-[var(--color-text-muted)]">
        {viewMode === 'featured' && !search
          ? t('table.showing', lang, { n: String(sorted.length), total: String(builders.length) })
          : t('table.trackingInfo', lang, { n: String(sorted.length) })
        }
      </p>
    </div>
  );
}
