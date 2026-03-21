import { useState, useEffect, useMemo } from 'react';
import type { Builder } from '../lib/fees';
import { formatFeePercent, totalTakerFee, totalMakerFee, formatVolume } from '../lib/fees';

type SortKey = 'usageFee' | 'users' | 'volume' | 'revenue' | 'totalTaker' | 'totalMaker';
type SortDir = 'asc' | 'desc';

const DEFAULT_VISIBLE = 20;

function getBuilderName(builder: Builder): string {
  if (builder.refCode) return builder.refCode;
  return `${builder.address.slice(0, 6)}...${builder.address.slice(-4)}`;
}

export default function BuilderTable() {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('usageFee');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showAll, setShowAll] = useState(false);

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

  const sorted = useMemo(() => {
    const copy = [...builders];
    copy.sort((a, b) => {
      let va: number, vb: number;
      switch (sortKey) {
        case 'usageFee': va = a.usageFee; vb = b.usageFee; break;
        case 'users': va = a.users; vb = b.users; break;
        case 'volume': va = a.volume; vb = b.volume; break;
        case 'revenue': va = a.revenue; vb = b.revenue; break;
        case 'totalTaker': va = totalTakerFee(a.usageFee); vb = totalTakerFee(b.usageFee); break;
        case 'totalMaker': va = totalMakerFee(a.usageFee); vb = totalMakerFee(b.usageFee); break;
        default: va = a.usageFee; vb = b.usageFee;
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return copy;
  }, [builders, sortKey, sortDir]);

  const visible = showAll ? sorted : sorted.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = sorted.length - DEFAULT_VISIBLE;

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'usageFee' || key === 'totalTaker' || key === 'totalMaker' ? 'asc' : 'desc');
    }
  }

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => (
    <span className={`ml-1 inline-block ${active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
      {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] px-4 py-3 flex gap-16">
          {['w-20', 'w-16', 'w-16', 'w-16', 'w-12', 'w-14'].map((w, i) => (
            <div key={i} className={`h-4 ${w} bg-[var(--color-border)] rounded animate-pulse`} />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 border-b border-[var(--color-border)] last:border-0 flex gap-16">
            {['w-24', 'w-14', 'w-14', 'w-14', 'w-10', 'w-12'].map((w, j) => (
              <div key={j} className={`h-4 ${w} bg-[var(--color-border)]/50 rounded animate-pulse`} style={{ animationDelay: `${(i * 6 + j) * 50}ms` }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-[var(--color-danger)]">
        Failed to load builder data: {error}
      </div>
    );
  }

  const columns: { key: SortKey; label: string; align?: string }[] = [
    { key: 'usageFee', label: 'Builder Fee' },
    { key: 'totalTaker', label: 'Total Taker' },
    { key: 'totalMaker', label: 'Total Maker' },
    { key: 'users', label: 'Users', align: 'right' },
    { key: 'volume', label: 'Volume', align: 'right' },
  ];

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)]">Builder</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)] select-none ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((builder) => {
              const isLowest = builder.usageFee === 0;
              return (
                <tr
                  key={builder.address}
                  className={`border-b border-[var(--color-border)] last:border-0 transition-colors hover:bg-[var(--color-bg-secondary)] ${isLowest ? 'bg-[var(--color-success-bg)]' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getBuilderName(builder)}</span>
                      {isLowest && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--color-success)] text-white font-medium">
                          Best Rate
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`px-4 py-3 tabular-nums ${isLowest ? 'text-[var(--color-success)] font-semibold' : ''}`}>
                    {builder.usageFee === 0 ? 'FREE' : formatFeePercent(builder.usageFee)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatFeePercent(totalTakerFee(builder.usageFee))}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatFeePercent(totalMakerFee(builder.usageFee))}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {builder.users.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatVolume(builder.volume)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!showAll && hiddenCount > 0 && (
        <div className="mt-3 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-medium py-2 px-4 min-h-[44px] transition-colors"
          >
            Show all {sorted.length} builders (+{hiddenCount} more)
          </button>
        </div>
      )}
      {showAll && sorted.length > DEFAULT_VISIBLE && (
        <div className="mt-3 text-center">
          <button
            onClick={() => setShowAll(false)}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium py-2 px-4 min-h-[44px] transition-colors"
          >
            Show less
          </button>
        </div>
      )}

      <p className="mt-3 text-xs text-[var(--color-text-muted)]">
        {sorted.length} builders tracked. Data from HyperTracker.
      </p>
    </div>
  );
}
