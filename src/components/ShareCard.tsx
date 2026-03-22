import { useState, useCallback, useEffect } from 'react';
import type { FeeBreakdown } from '../lib/api';
import { formatUSD, formatVolume } from '../lib/fees';
import { useLang, t } from '../lib/i18n';
import type { Lang } from '../lib/i18n';
import { track, Events } from '../lib/analytics';

// ============================================================
// Design Tokens — self-contained dark card palette
// ============================================================
const tokens = {
  colors: {
    bg:            '#111114',
    surface:       'rgba(255,255,255,0.025)',
    surfaceBorder: 'rgba(255,255,255,0.06)',
    accent:        '#1EF17D',
    accentDim:     'rgba(30,241,125,0.08)',
    accentBorder:  'rgba(30,241,125,0.14)',
    accentGlow:    'rgba(30,241,125,0.45)',
    textPrimary:   '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)',
    textTertiary:  'rgba(255,255,255,0.4)',
    textMuted:     'rgba(255,255,255,0.3)',
    textFaint:     'rgba(255,255,255,0.2)',
    emojiBg:       'rgba(255,255,255,0.06)',
  },
  fonts: {
    sans: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
  },
  radii: {
    sm: '9px',
    md: '12px',
    lg: '16px',
    pill: '9999px',
  },
};

// ============================================================
// Data Helpers
// ============================================================
// Update periodically — check https://stats.hyperliquid.xyz
const TOTAL_TRADERS = 350_000;

function estimateRank(totalFees: number) {
  let percentile: number, title: string;
  if (totalFees >= 100_000) { percentile = 99.9; title = 'Legendary Degen'; }
  else if (totalFees >= 50_000) { percentile = 99.5; title = 'Whale Status'; }
  else if (totalFees >= 10_000) { percentile = 99; title = 'Fee Machine'; }
  else if (totalFees >= 5_000) { percentile = 97; title = 'Heavy Hitter'; }
  else if (totalFees >= 1_000) { percentile = 90; title = 'Serious Trader'; }
  else if (totalFees >= 500) { percentile = 80; title = 'Active Trader'; }
  else if (totalFees >= 100) { percentile = 60; title = 'Getting Started'; }
  else if (totalFees >= 10) { percentile = 30; title = 'Explorer'; }
  else { percentile = 10; title = 'Just Arrived'; }

  const topPercent = +(100 - percentile).toFixed(1);
  const rank = Math.max(1, Math.round(TOTAL_TRADERS * topPercent / 100));
  return { percentile, topPercent, rank, total: TOTAL_TRADERS, title };
}

interface FunFacts {
  coffees: number;
  iphones: number;
  flights: number;
  ethTxns: number;
  burritos: number;
  dailyFee: number;
  netflixMultiple: number;
  steamGames: number;
  rentMonths: number;
  beers: number;
  uberRides: number;
  spotifyYears: number;
  daysBetween: number;
}

function computeFunFacts(totalFees: number, daysBetween: number): FunFacts {
  return {
    coffees: Math.round(totalFees / 6),
    iphones: +(totalFees / 999).toFixed(1),
    flights: Math.round(totalFees / 1600),
    ethTxns: Math.round(totalFees / 10),
    burritos: Math.round(totalFees / 10),
    dailyFee: +(totalFees / Math.max(daysBetween, 1)).toFixed(1),
    netflixMultiple: Math.round((totalFees / Math.max(daysBetween, 1)) / 0.5),
    steamGames: Math.round(totalFees / 60),
    rentMonths: Math.round(totalFees / 3200),
    beers: Math.round(totalFees / 7),
    uberRides: Math.round(totalFees / 15),
    spotifyYears: Math.round(totalFees / 144),
    daysBetween,
  };
}

function formatPeriod(first: number | null, last: number | null): string {
  if (!first || !last) return '';
  const f = new Date(first);
  const l = new Date(last);
  const fmt = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `${fmt(f)} — ${fmt(l)}`;
}

function formatNum(n: number): string {
  return n.toLocaleString();
}

function yearsLabel(days: number): string {
  if (days <= 0) return 'a moment';
  const y = days / 365;
  if (y >= 2) return `${y.toFixed(1)} years`;
  if (y >= 1) return `${y.toFixed(1)} year`;
  const m = Math.round(days / 30);
  if (m >= 2) return `${m} months`;
  if (m === 1) return '1 month';
  if (days >= 2) return `${days} days`;
  return '1 day';
}

function yearsLabelI18n(days: number, lang: Lang): string {
  if (days <= 0) return t('card.aMoment', lang);
  const y = days / 365;
  if (y >= 2) return `${y.toFixed(1)} ${t('card.years', lang)}`;
  if (y >= 1) return `${y.toFixed(1)} ${t('card.year', lang)}`;
  const m = Math.round(days / 30);
  if (m >= 2) return `${m} ${t('card.months', lang)}`;
  if (m === 1) return `1 ${t('card.month', lang)}`;
  if (days >= 2) return `${days} ${t('card.days', lang)}`;
  return `1 ${t('card.day', lang)}`;
}

// ============================================================
// Primitive Components
// ============================================================
const badgeSizes: Record<string, { width: number; height: number; borderRadius: string; fontSize: number }> = {
  sm: { width: 30, height: 30, borderRadius: tokens.radii.sm, fontSize: 15 },
  md: { width: 40, height: 40, borderRadius: tokens.radii.md, fontSize: 20 },
  lg: { width: 48, height: 48, borderRadius: '14px', fontSize: 24 },
};

function EmojiBadge({ emoji, size = 'md', style }: { emoji: string; size?: string; style?: React.CSSProperties }) {
  const s = badgeSizes[size] || badgeSizes.md;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: s.width,
        height: s.height,
        borderRadius: s.borderRadius,
        background: tokens.colors.emojiBg,
        fontSize: s.fontSize,
        flexShrink: 0,
        ...style,
      }}
    >
      {emoji}
    </span>
  );
}

function MonoValue({ value, unit, size = 24, style }: { value: string; unit?: string; size?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: tokens.fonts.mono,
        fontSize: size,
        fontWeight: 700,
        color: tokens.colors.textPrimary,
        letterSpacing: '-0.03em',
        lineHeight: 1.2,
        ...style,
      }}
    >
      {value}
      {unit && (
        <span
          style={{
            fontFamily: tokens.fonts.sans,
            fontSize: 13,
            fontWeight: 500,
            color: tokens.colors.textTertiary,
            letterSpacing: 0,
            marginLeft: 3,
          }}
        >
          {unit}
        </span>
      )}
    </div>
  );
}

function StatCard({ emoji, value, unit, label, description, style }: {
  emoji: string; value: string; unit?: string; label: string; description?: string; style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: tokens.colors.surface,
        border: `1px solid ${tokens.colors.surfaceBorder}`,
        borderRadius: tokens.radii.lg,
        padding: '14px 14px',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <EmojiBadge emoji={emoji} size="md" />
        <MonoValue value={value} unit={unit} size={22} />
      </div>
      <div
        style={{
          fontSize: 11,
          color: tokens.colors.textMuted,
          lineHeight: 1.4,
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{label}</span>
        {description && (
          <>
            <br />
            {description}
          </>
        )}
      </div>
    </div>
  );
}

function InlineStatCard({ segments, style }: {
  segments: { type: 'emoji' | 'text' | 'number' | 'muted'; content: string; size?: string }[];
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: tokens.colors.surface,
        border: `1px solid ${tokens.colors.surfaceBorder}`,
        borderRadius: tokens.radii.lg,
        padding: '18px 16px',
        gridColumn: '1 / -1',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {segments.map((seg, i) => {
          switch (seg.type) {
            case 'emoji':
              return <EmojiBadge key={i} emoji={seg.content} size={seg.size || 'md'} />;
            case 'number':
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: tokens.fonts.mono,
                    fontWeight: 700,
                    color: tokens.colors.textPrimary,
                    fontSize: 17,
                  }}
                >
                  {seg.content}
                </span>
              );
            case 'muted':
              return (
                <span
                  key={i}
                  style={{
                    fontSize: 15,
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.28)',
                    lineHeight: 1.7,
                  }}
                >
                  {seg.content}
                </span>
              );
            default:
              return (
                <span
                  key={i}
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: tokens.colors.textSecondary,
                    lineHeight: 1.7,
                  }}
                >
                  {seg.content}
                </span>
              );
          }
        })}
      </div>
    </div>
  );
}

function BentoGrid({ children, gap = 10, style }: { children: React.ReactNode; gap?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap, ...style }}>
      {children}
    </div>
  );
}

function Pill({ emoji, value, label, style }: { emoji: string; value: string; label: string; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: tokens.colors.surface,
        border: `1px solid ${tokens.colors.surfaceBorder}`,
        borderRadius: tokens.radii.pill,
        padding: '6px 14px 6px 6px',
        fontSize: 12,
        color: 'rgba(255,255,255,0.42)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <EmojiBadge emoji={emoji} size="sm" />
      <strong
        style={{
          fontFamily: tokens.fonts.mono,
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        {value}
      </strong>
      {label}
    </div>
  );
}

function PercentileBar({ percent = 99.7, label, lang, style }: {
  percent?: number; label?: string; lang?: Lang; style?: React.CSSProperties;
}) {
  const resolvedLabel = label ?? t('card.youAreHere', lang ?? 'en' as Lang);
  return (
    <div style={style}>
      <div
        style={{
          height: 5,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 3,
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(percent, 100)}%`,
            background: `linear-gradient(90deg, rgba(30,241,125,0.2), ${tokens.colors.accent})`,
            borderRadius: 3,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -5,
              top: -5.5,
              width: 16,
              height: 16,
              background: tokens.colors.accent,
              borderRadius: '50%',
              border: `3px solid ${tokens.colors.bg}`,
              boxShadow: `0 0 14px ${tokens.colors.accentGlow}`,
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          marginTop: 6,
          fontSize: 10,
          color: tokens.colors.textFaint,
        }}
      >
        <span style={{ position: 'absolute', left: 0 }}>0%</span>
        <span
          style={{
            position: 'absolute',
            left: `${Math.min(percent, 100)}%`,
            transform: 'translateX(-100%)',
            color: tokens.colors.accent,
            fontWeight: 600,
            fontSize: 11,
            whiteSpace: 'nowrap',
            paddingRight: 4,
          }}
        >
          {resolvedLabel} →
        </span>
        <span style={{ position: 'absolute', right: 0 }}>100%</span>
        {/* Spacer for height */}
        <span style={{ visibility: 'hidden' }}>0%</span>
      </div>
    </div>
  );
}

function HeroStat({ prefix, value, subtitle, label, style }: {
  prefix?: string; value: string; subtitle?: string; label?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{ textAlign: 'center', ...style }}>
      {label && (
        <div
          style={{
            fontSize: 12,
            color: tokens.colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            marginBottom: 10,
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          fontFamily: tokens.fonts.mono,
          fontSize: 56,
          fontWeight: 700,
          color: tokens.colors.textPrimary,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {prefix && (
          <span style={{ fontSize: 30, color: tokens.colors.textTertiary, fontWeight: 400 }}>
            {prefix}
          </span>
        )}
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>{subtitle}</div>
      )}
    </div>
  );
}

function RankBadge({ emoji = '👑', rank, total, topPercent, lang, children, style }: {
  emoji?: string; rank: number; total: number; topPercent: number; lang?: Lang; children?: React.ReactNode; style?: React.CSSProperties;
}) {
  const l = lang ?? 'en' as Lang;
  return (
    <div
      style={{
        background: 'rgba(30,241,125,0.05)',
        border: '1px solid rgba(30,241,125,0.1)',
        borderRadius: tokens.radii.lg,
        padding: '18px 20px',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: children ? 14 : 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <EmojiBadge emoji={emoji} />
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
            {t('card.globalRank', l)}{' '}
            <strong style={{ color: tokens.colors.accent, fontWeight: 600 }}>
              #{rank.toLocaleString()}
            </strong>
            <br />
            {t('card.outOf', l, { n: total.toLocaleString() })}
          </span>
        </div>
        <span
          style={{
            fontFamily: tokens.fonts.mono,
            fontSize: 22,
            fontWeight: 700,
            color: tokens.colors.accent,
            letterSpacing: '-0.02em',
          }}
        >
          {t('card.top', l, { n: String(topPercent) })}
        </span>
      </div>
      {children}
    </div>
  );
}

// ============================================================
// Pick best fun fact items based on fee amount
// ============================================================
function pickStatCards(f: FunFacts, lang: Lang): { emoji: string; value: string; unit: string; label: string; description: string }[] {
  const cards: { emoji: string; value: string; unit: string; label: string; description: string }[] = [];

  // Always show coffees
  const coffeeDesc = f.coffees >= 365
    ? t('card.cupADay', lang, { t: yearsLabelI18n(f.coffees, lang) })
    : f.coffees >= 7
      ? t('card.weeksOfCoffee', lang, { n: String(Math.round(f.coffees / 7)) })
      : f.coffees >= 1
        ? t('card.pickMeUps', lang, { n: String(f.coffees) })
        : t('card.noLatteYet', lang);
  cards.push({
    emoji: '☕',
    value: formatNum(Math.max(1, f.coffees)),
    unit: f.coffees > 1 ? t('card.cups', lang) : t('card.cup', lang),
    label: t('card.starbucks', lang),
    description: coffeeDesc,
  });

  // iPhones > Steam games > beers (pick the one with a meaningful number)
  if (f.iphones >= 1) {
    cards.push({
      emoji: '📱',
      value: f.iphones >= 10 ? String(Math.round(f.iphones)) : String(f.iphones),
      unit: f.iphones >= 2 ? t('card.units', lang) : t('card.unit', lang),
      label: t('card.iphone', lang),
      description: f.iphones >= 10 ? t('card.iphoneMany', lang) : t('card.iphoneOne', lang),
    });
  } else if (f.steamGames >= 1) {
    cards.push({
      emoji: '🎮',
      value: formatNum(f.steamGames),
      unit: f.steamGames > 1 ? t('card.games', lang) : t('card.game', lang),
      label: t('card.steamGames', lang),
      description: t('card.gamingBacklog', lang, { t: yearsLabelI18n(f.steamGames * 30, lang) }),
    });
  } else {
    cards.push({
      emoji: '🍺',
      value: formatNum(Math.max(1, f.beers)),
      unit: f.beers > 1 ? t('card.beers', lang) : t('card.beer', lang),
      label: t('card.draftBeers', lang),
      description: t('card.cheers', lang),
    });
  }

  // Flights > Uber rides (pick the meaningful one)
  if (f.flights >= 1) {
    cards.push({
      emoji: '✈️',
      value: String(f.flights),
      unit: f.flights > 1 ? t('card.trips', lang) : t('card.trip', lang),
      label: t('card.flights', lang),
      description: f.flights >= 4 ? t('card.oneEvery', lang, { n: String(Math.round(f.daysBetween / f.flights / 7)) }) : t('card.champagne', lang),
    });
  } else if (f.uberRides >= 1) {
    cards.push({
      emoji: '🚕',
      value: formatNum(f.uberRides),
      unit: f.uberRides > 1 ? t('card.rides', lang) : t('card.ride', lang),
      label: t('card.uberRides', lang),
      description: f.uberRides >= 30 ? t('card.aRideEvery', lang, { n: String(Math.round(f.daysBetween / f.uberRides)) }) : t('card.noWalking', lang),
    });
  } else {
    cards.push({
      emoji: '🍕',
      value: String(Math.max(1, Math.round(f.coffees / 2))),
      unit: t('card.slices', lang),
      label: t('card.pizzaSlices', lang),
      description: t('card.tradingFuel', lang),
    });
  }

  // ETH L1 transfers
  cards.push({
    emoji: '⛽',
    value: formatNum(Math.max(1, f.ethTxns)),
    unit: f.ethTxns > 1 ? t('card.txns', lang) : t('card.txn', lang),
    label: t('card.ethL1', lang),
    description: t('card.ethL1Desc', lang),
  });

  return cards;
}

function pickPills(f: FunFacts, lang: Lang): { emoji: string; value: string; label: string }[] {
  const pills: { emoji: string; value: string; label: string }[] = [];
  if (f.steamGames >= 2) pills.push({ emoji: '🎮', value: formatNum(f.steamGames), label: t('card.steamPill', lang) });
  if (f.rentMonths >= 1) pills.push({ emoji: '🏠', value: String(f.rentMonths), label: t('card.rentPill', lang) });
  if (f.beers >= 10) pills.push({ emoji: '🍺', value: formatNum(f.beers), label: t('card.beersPill', lang) });
  if (f.uberRides >= 5) pills.push({ emoji: '🚕', value: formatNum(f.uberRides), label: t('card.uberPill', lang) });
  if (f.spotifyYears >= 1) pills.push({ emoji: '🎵', value: String(f.spotifyYears), label: t('card.spotifyPill', lang) });
  return pills.slice(0, 5);
}

// ============================================================
// Canvas Image Generation (1200×675 for Twitter)
// ============================================================
function generateImage(
  result: FeeBreakdown,
  shortAddr: string,
  period: string,
  rankInfo: ReturnType<typeof estimateRank>,
  funFacts: FunFacts,
  lang: Lang,
) {
  const W = 1200, H = 675;
  const S = 2; // 2x resolution for sharpness
  const canvas = document.createElement('canvas');
  canvas.width = W * S;
  canvas.height = H * S;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(S, S);

  // Rounded clip
  const r = 40;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, r);
  ctx.clip();

  // BG
  ctx.fillStyle = tokens.colors.bg;
  ctx.fillRect(0, 0, W, H);

  // Ambient glow (top right)
  const glow = ctx.createRadialGradient(W * 0.82, H * 0.12, 0, W * 0.82, H * 0.12, 260);
  glow.addColorStop(0, 'rgba(30,241,125,0.07)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const lx = 60, rx = W - 60;
  const cw = rx - lx;

  // ── Header label ──
  ctx.font = '500 11px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '0.14em';
  ctx.fillText(t('card.totalFeesPaid', lang).toUpperCase(), W / 2, 50);
  ctx.letterSpacing = '0';

  // ── Big number ──
  ctx.font = '700 62px ui-monospace, "SF Mono", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(formatUSD(result.totalFees), W / 2, 110);

  // ── Period ──
  ctx.font = '400 13px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillText(period, W / 2, 134);

  // ── Rank badge area ──
  const rbY = 158, rbH = 70;
  ctx.fillStyle = 'rgba(30,241,125,0.05)';
  ctx.beginPath(); ctx.roundRect(lx, rbY, cw, rbH, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(30,241,125,0.1)'; ctx.lineWidth = 1; ctx.stroke();

  // Rank text left
  const rankLabel = `👑  ${t('card.globalRank', lang)}`;
  ctx.font = '400 13px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'left';
  ctx.fillText(rankLabel, lx + 18, rbY + 24);
  const rankLabelW = ctx.measureText(rankLabel).width;
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = tokens.colors.accent;
  ctx.fillText(` #${rankInfo.rank.toLocaleString()}`, lx + 18 + rankLabelW, rbY + 24);
  ctx.font = '400 12px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText(t('card.outOf', lang, { n: rankInfo.total.toLocaleString() }), lx + 18, rbY + 42);

  // Top percent right
  ctx.font = '700 22px ui-monospace, monospace';
  ctx.fillStyle = tokens.colors.accent;
  ctx.textAlign = 'right';
  ctx.fillText(t('card.top', lang, { n: String(rankInfo.topPercent) }), rx - 18, rbY + 30);

  // Percentile bar
  const pbX = lx + 18, pbY = rbY + 54, pbW = cw - 36, pbH = 5;
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath(); ctx.roundRect(pbX, pbY, pbW, pbH, 3); ctx.fill();
  const grad = ctx.createLinearGradient(pbX, 0, pbX + pbW * (rankInfo.percentile / 100), 0);
  grad.addColorStop(0, 'rgba(30,241,125,0.2)');
  grad.addColorStop(1, tokens.colors.accent);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(pbX, pbY, pbW * (rankInfo.percentile / 100), pbH, 3); ctx.fill();

  const dotX = pbX + pbW * (rankInfo.percentile / 100);
  ctx.fillStyle = tokens.colors.accent;
  ctx.beginPath(); ctx.arc(dotX, pbY + 2.5, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = tokens.colors.bg;
  ctx.beginPath(); ctx.arc(dotX, pbY + 2.5, 3, 0, Math.PI * 2); ctx.fill();

  // ── 4 Stat cards (2×2) ──
  const statCards = pickStatCards(funFacts, lang);
  const gridY = rbY + rbH + 14;
  const gap = 10;
  const cardW = (cw - gap) / 2;
  const cardH = 72;

  statCards.forEach((card, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const cx = lx + col * (cardW + gap);
    const cy = gridY + row * (cardH + gap);

    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.beginPath(); ctx.roundRect(cx, cy, cardW, cardH, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.stroke();

    ctx.font = '20px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
    ctx.fillText(card.emoji, cx + 16, cy + 30);

    ctx.font = '700 22px ui-monospace, monospace'; ctx.fillStyle = '#fff';
    ctx.fillText(card.value, cx + 48, cy + 30);
    const valW = ctx.measureText(card.value).width;
    ctx.font = '500 12px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(card.unit, cx + 48 + valW + 4, cy + 30);

    ctx.font = '500 11px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(card.label, cx + 48, cy + 50);
    ctx.font = '400 10px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText(card.description, cx + 48, cy + 64);
  });

  // ── Inline stat cards ──
  const inlineY = gridY + 2 * (cardH + gap) + 4;
  const inlineH = 40;

  // Burritos line
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  ctx.beginPath(); ctx.roundRect(lx, inlineY, cw, inlineH, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.stroke();

  const burritoLabel = funFacts.burritos > 1 ? t('card.burritos', lang) : t('card.burrito', lang);
  ctx.textAlign = 'left';
  let tx = lx + 16;
  ctx.font = '16px system-ui'; ctx.fillStyle = '#fff';
  ctx.fillText('🌯', tx, inlineY + 26); tx += 32;
  ctx.font = '500 14px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
  const thatsStr = t('card.thats', lang);
  ctx.fillText(thatsStr, tx, inlineY + 26); tx += ctx.measureText(thatsStr).width + 8;
  ctx.font = '700 15px ui-monospace, monospace'; ctx.fillStyle = '#fff';
  const burritoNum = formatNum(Math.max(1, funFacts.burritos));
  ctx.fillText(burritoNum, tx, inlineY + 26); tx += ctx.measureText(burritoNum).width + 8;
  ctx.font = '500 14px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(burritoLabel, tx, inlineY + 26); tx += ctx.measureText(burritoLabel).width + 12;
  ctx.font = '400 13px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillText(`· ${yearsLabelI18n(funFacts.burritos, lang)}`, tx, inlineY + 26);

  // Daily fee line
  const inline2Y = inlineY + inlineH + gap;
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  ctx.beginPath(); ctx.roundRect(lx, inline2Y, cw, inlineH, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.stroke();

  const payingStr = t('card.paying', lang);
  const perDayStr = t('card.perDay', lang);
  tx = lx + 16;
  ctx.font = '16px system-ui'; ctx.fillStyle = '#fff';
  ctx.fillText('💸', tx, inline2Y + 26); tx += 32;
  ctx.font = '500 14px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(payingStr, tx, inline2Y + 26); tx += ctx.measureText(payingStr).width + 8;
  ctx.font = '700 15px ui-monospace, monospace'; ctx.fillStyle = '#fff';
  const dailyStr = `$${funFacts.dailyFee}`;
  ctx.fillText(dailyStr, tx, inline2Y + 26); tx += ctx.measureText(dailyStr).width + 6;
  ctx.font = '500 14px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(perDayStr, tx, inline2Y + 26); tx += ctx.measureText(perDayStr).width + 8;
  ctx.font = '14px system-ui'; ctx.fillStyle = '#fff';
  ctx.fillText('🫡', tx, inline2Y + 26); tx += 24;
  if (funFacts.netflixMultiple >= 2) {
    ctx.font = '400 13px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText(`· ${t('card.netflix', lang, { n: String(funFacts.netflixMultiple) })}`, tx, inline2Y + 26);
  }

  // ── Pills row ──
  const pills = pickPills(funFacts, lang);
  const pillY = inline2Y + inlineH + 16;
  let px = lx;
  pills.forEach((pill) => {
    const text = `${pill.emoji}  ${pill.value} ${pill.label}`;
    ctx.font = '500 11px system-ui, sans-serif';
    const tw = ctx.measureText(text).width + 24;

    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.beginPath(); ctx.roundRect(px, pillY, tw, 30, 15); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '13px system-ui'; ctx.fillStyle = '#fff';
    ctx.fillText(pill.emoji, px + 8, pillY + 20);
    ctx.font = '600 12px ui-monospace, monospace'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(pill.value, px + 28, pillY + 20);
    const vw = ctx.measureText(pill.value).width;
    ctx.font = '400 11px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(pill.label, px + 28 + vw + 5, pillY + 20);

    px += tw + 8;
  });

  // ── Footer ──
  ctx.font = '400 11px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.textAlign = 'left';
  ctx.fillText(t('card.poweredBy', lang), lx, H - 28);
  ctx.textAlign = 'right';
  ctx.font = '400 11px ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillText(shortAddr, rx, H - 28);

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(0.5, 0.5, W - 1, H - 1, r); ctx.stroke();

  // Download
  const link = document.createElement('a');
  link.download = `hypefees-wrapped-${shortAddr}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ============================================================
// Main Component
// ============================================================
interface ShareCardProps {
  result: FeeBreakdown;
  address: string;
}

export default function ShareCard({ result, address }: ShareCardProps) {
  const [lang] = useLang();
  const [open, setOpen] = useState(false);
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const period = formatPeriod(result.firstTradeTime, result.lastTradeTime);
  const rankInfo = estimateRank(result.totalFees);

  const daysBetween = result.firstTradeTime && result.lastTradeTime
    ? Math.max(1, Math.ceil((result.lastTradeTime - result.firstTradeTime) / (1000 * 60 * 60 * 24)))
    : 1;

  const funFacts = computeFunFacts(result.totalFees, daysBetween);
  const statCards = pickStatCards(funFacts, lang);
  const pills = pickPills(funFacts, lang);
  const feeStr = formatUSD(result.totalFees).replace('$', '');

  const handleDownload = useCallback(() => {
    track(Events.SHARE_CARD_DOWNLOADED, { total_fees: result.totalFees, rank_title: rankInfo.title });
    generateImage(result, shortAddr, period, rankInfo, funFacts, lang);
  }, [result, shortAddr, period, rankInfo, funFacts]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  return (
    <>
      {/* Compact trigger button */}
      <div className="mt-6">
        <button
          onClick={() => { setOpen(true); track(Events.SHARE_CARD_OPENED, { total_fees: result.totalFees, rank_title: rankInfo.title }); }}
          className="w-full p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] card-hover flex items-center justify-between gap-4 group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div className="text-left">
              <div className="font-semibold text-sm">{t('share.title', lang)}</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {rankInfo.title} · {formatUSD(result.totalFees)} in fees · {rankInfo.rank > 0 ? `Top ${rankInfo.topPercent}%` : ''}
              </div>
            </div>
          </div>
          <span className="px-4 py-2 text-xs font-semibold rounded-full bg-[var(--color-text)] text-[var(--color-bg)] shrink-0 group-hover:opacity-85 transition-opacity">
            {t('share.viewCard', lang)}
          </span>
        </button>
      </div>

      {/* Modal overlay */}
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal content — scrollable on mobile */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              maxWidth: 820,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 10,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>

            {/* The card — wide compact layout */}
            <div
              style={{
                background: tokens.colors.bg,
                borderRadius: 28,
                padding: '28px 32px 24px',
                border: `1px solid ${tokens.colors.surfaceBorder}`,
                position: 'relative',
                overflow: 'hidden',
                fontFamily: tokens.fonts.sans,
              }}
            >
              {/* Ambient glow */}
              <div
                style={{
                  position: 'absolute',
                  top: -80,
                  right: -40,
                  width: 320,
                  height: 320,
                  background: 'radial-gradient(circle, rgba(30,241,125,0.07) 0%, transparent 65%)',
                  pointerEvents: 'none',
                }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Row 1: Hero number + Rank side by side (stacks on mobile) */}
                <div className="share-modal-hero" style={{ marginBottom: 16 }}>
                  {/* Left: big number */}
                  <div style={{ flex: '0 0 auto' }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: tokens.colors.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        marginBottom: 6,
                      }}
                    >
                      {t('card.totalFeesPaid', lang)}
                    </div>
                    <div
                      style={{
                        fontFamily: tokens.fonts.mono,
                        fontSize: 48,
                        fontWeight: 700,
                        color: tokens.colors.textPrimary,
                        letterSpacing: '-0.04em',
                        lineHeight: 1,
                      }}
                    >
                      <span style={{ fontSize: 26, color: tokens.colors.textTertiary, fontWeight: 400 }}>$</span>
                      {feeStr}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{period}</div>
                  </div>

                  {/* Right: rank badge (flexible width) */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <RankBadge
                      rank={rankInfo.rank}
                      total={rankInfo.total}
                      topPercent={rankInfo.topPercent}
                      lang={lang}
                    >
                      <PercentileBar percent={rankInfo.percentile} lang={lang} />
                    </RankBadge>
                  </div>
                </div>

                {/* Row 2: 4 stat cards in one row */}
                <div className="share-modal-stats" style={{ marginBottom: 8 }}>
                  {statCards.map((card, i) => (
                    <StatCard key={i} {...card} />
                  ))}
                </div>

                {/* Row 3: two inline stat cards side by side */}
                <div className="share-modal-inline" style={{ marginBottom: 8 }}>
                  <InlineStatCard
                    style={{ gridColumn: 'auto' }}
                    segments={[
                      { type: 'emoji', content: '🌯' },
                      { type: 'text', content: t('card.thats', lang) },
                      { type: 'number', content: formatNum(Math.max(1, funFacts.burritos)) },
                      { type: 'text', content: funFacts.burritos > 1 ? t('card.burritos', lang) : t('card.burrito', lang) },
                      { type: 'muted', content: `· ${t('card.lunchEveryDay', lang, { t: yearsLabelI18n(funFacts.burritos, lang) })}` },
                    ]}
                  />
                  <InlineStatCard
                    style={{ gridColumn: 'auto' }}
                    segments={[
                      { type: 'emoji', content: '💸' },
                      { type: 'text', content: t('card.paying', lang) },
                      { type: 'number', content: `$${funFacts.dailyFee}` },
                      { type: 'text', content: t('card.perDay', lang) },
                      { type: 'emoji', content: '🫡', size: 'sm' },
                      ...(funFacts.netflixMultiple >= 2
                        ? [{ type: 'muted' as const, content: `· ${t('card.netflix', lang, { n: String(funFacts.netflixMultiple) })}` }]
                        : []),
                    ]}
                  />
                </div>

                {/* Row 4: pills + footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  {pills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                      {pills.map((pill, i) => (
                        <Pill key={i} {...pill} />
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>
                      {t('card.poweredBy', lang)}
                    </span>
                    <span
                      style={{
                        fontFamily: tokens.fonts.mono,
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.22)',
                      }}
                    >
                      {shortAddr}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions below card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, justifyContent: 'center' }}>
              <button
                onClick={handleDownload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 12,
                  background: tokens.colors.accent,
                  color: '#000',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M7 10l5 5 5-5M12 15V3" />
                </svg>
                {t('share.download', lang)}
              </button>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                {t('card.optimized', lang)}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
