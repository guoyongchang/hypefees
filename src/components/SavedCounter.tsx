import { useState, useEffect, useRef } from 'react';
import { useLang, t } from '../lib/i18n';

function formatCompactUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function formatWithCommas(n: number): string {
  return Math.round(n).toLocaleString();
}

function useCountUp(target: number, duration = 1500): number {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    if (target <= 0) return;

    startTime.current = null;

    function tick(ts: number) {
      if (!startTime.current) startTime.current = ts;
      const elapsed = ts - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafId.current = requestAnimationFrame(tick);
      }
    }

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [target, duration]);

  return value;
}

export default function SavedCounter() {
  const [lang] = useLang();
  const [stats, setStats] = useState<{ users: number; savings: number } | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        if (data.users && data.savings) setStats(data);
      })
      .catch(() => {});
  }, []);

  const animatedUsers = useCountUp(stats?.users ?? 0);
  const animatedSavings = useCountUp(stats?.savings ?? 0);

  if (!stats) return null;

  const text = t('hero.savedCounter', lang, {
    users: formatWithCommas(animatedUsers),
    savings: formatCompactUSD(animatedSavings),
  });

  return (
    <div className="flex items-center gap-1.5 text-[12px] md:text-[13px] text-[var(--color-text-muted)] mb-4 select-none">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-60">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      <span className="tabular-nums">{text}</span>
    </div>
  );
}
