import { useState, useEffect, useRef } from 'react';
import { useLang, t } from '../lib/i18n';

// Total builder revenue from cached data (~$68.7M as of snapshot)
// This ticks up based on estimated daily rate (~$200K/day across all builders)
const BASE_REVENUE = 68_696_886;
const BASE_TIMESTAMP = 1742533200000; // 2026-03-21T00:00:00Z approx
const DAILY_RATE = 200_000; // ~$200K/day estimated from revenue growth
const PER_MS = DAILY_RATE / 86_400_000;

export default function FeeCounter() {
  const [lang] = useLang();
  const [value, setValue] = useState(BASE_REVENUE);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    function tick() {
      const elapsed = Date.now() - BASE_TIMESTAMP;
      const current = BASE_REVENUE + elapsed * PER_MS;
      setValue(current);
      rafRef.current = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const formatted = value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="hidden md:flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
      {/* Pulse dot */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-50"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent)]"></span>
      </span>
      <span className="tabular-nums tracking-tight">
        <span className="font-semibold text-[var(--color-text-secondary)]">{formatted}</span>
        {' '}
        <span className="text-[var(--color-text-muted)]">{t('counter.avoidableFees', lang)}</span>
      </span>
    </div>
  );
}
