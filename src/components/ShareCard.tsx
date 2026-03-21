import { useState, useCallback, useEffect } from 'react';
import type { FeeBreakdown } from '../lib/api';
import { formatUSD, formatVolume } from '../lib/fees';
import { useLang, t } from '../lib/i18n';

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
const TOTAL_TRADERS = 310_000;

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
    beers: Math.round(totalFees / 2),
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

function PercentileBar({ percent = 99.7, label = 'You are here', style }: {
  percent?: number; label?: string; style?: React.CSSProperties;
}) {
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
          {label} →
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

function RankBadge({ emoji = '👑', rank, total, topPercent, children, style }: {
  emoji?: string; rank: number; total: number; topPercent: number; children?: React.ReactNode; style?: React.CSSProperties;
}) {
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
            Global rank{' '}
            <strong style={{ color: tokens.colors.accent, fontWeight: 600 }}>
              #{rank.toLocaleString()}
            </strong>
            <br />
            out of {total.toLocaleString()} traders
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
          Top {topPercent}%
        </span>
      </div>
      {children}
    </div>
  );
}

// ============================================================
// Pick best fun fact items based on fee amount
// ============================================================
function pickStatCards(f: FunFacts): { emoji: string; value: string; unit: string; label: string; description: string }[] {
  const cards: { emoji: string; value: string; unit: string; label: string; description: string }[] = [];

  // Always show coffees
  const coffeeDesc = f.coffees >= 365
    ? `A cup a day for ${yearsLabel(f.coffees)}`
    : f.coffees >= 7
      ? `${Math.round(f.coffees / 7)} weeks of daily coffee`
      : f.coffees >= 1
        ? `${f.coffees} morning pick-me-ups`
        : 'Not even one latte yet';
  cards.push({
    emoji: '☕',
    value: formatNum(Math.max(1, f.coffees)),
    unit: f.coffees > 1 ? 'cups' : 'cup',
    label: 'Starbucks grande lattes',
    description: coffeeDesc,
  });

  // iPhones > Steam games > beers (pick the one with a meaningful number)
  if (f.iphones >= 1) {
    cards.push({
      emoji: '📱',
      value: f.iphones >= 10 ? String(Math.round(f.iphones)) : String(f.iphones),
      unit: f.iphones >= 2 ? 'units' : 'unit',
      label: 'iPhone 16 Pro Max',
      description: f.iphones >= 10 ? 'Enough to open a small Apple Store' : 'A shiny new phone',
    });
  } else if (f.steamGames >= 1) {
    cards.push({
      emoji: '🎮',
      value: formatNum(f.steamGames),
      unit: f.steamGames > 1 ? 'games' : 'game',
      label: 'AAA Steam titles',
      description: `${yearsLabel(f.steamGames * 30)} of gaming backlog`,
    });
  } else {
    cards.push({
      emoji: '🍺',
      value: formatNum(Math.max(1, f.beers)),
      unit: f.beers > 1 ? 'beers' : 'beer',
      label: 'Draft beers',
      description: 'Cheers to the grind',
    });
  }

  // Flights > Uber rides (pick the meaningful one)
  if (f.flights >= 1) {
    cards.push({
      emoji: '✈️',
      value: String(f.flights),
      unit: f.flights > 1 ? 'trips' : 'trip',
      label: 'NYC ↔ London first class',
      description: f.flights >= 4 ? `One every ${Math.round(f.daysBetween / f.flights / 7)} weeks` : 'Champagne at 35,000 feet',
    });
  } else if (f.uberRides >= 1) {
    cards.push({
      emoji: '🚕',
      value: formatNum(f.uberRides),
      unit: f.uberRides > 1 ? 'rides' : 'ride',
      label: 'Uber rides',
      description: f.uberRides >= 30 ? `A ride every ${Math.round(f.daysBetween / f.uberRides)} days` : 'No walking needed',
    });
  } else {
    cards.push({
      emoji: '🍕',
      value: String(Math.max(1, Math.round(f.coffees / 2))),
      unit: 'slices',
      label: 'Pizza slices',
      description: 'Trading fuel',
    });
  }

  // ETH L1 transfers
  cards.push({
    emoji: '⛽',
    value: formatNum(Math.max(1, f.ethTxns)),
    unit: f.ethTxns > 1 ? 'txns' : 'txn',
    label: 'ETH L1 transfers',
    description: 'At avg $10 gas per tx',
  });

  return cards;
}

function pickPills(f: FunFacts): { emoji: string; value: string; label: string }[] {
  const pills: { emoji: string; value: string; label: string }[] = [];
  if (f.steamGames >= 2) pills.push({ emoji: '🎮', value: formatNum(f.steamGames), label: 'Steam AAA games' });
  if (f.rentMonths >= 1) pills.push({ emoji: '🏠', value: String(f.rentMonths), label: 'mo Manhattan rent' });
  if (f.beers >= 10) pills.push({ emoji: '🍺', value: formatNum(f.beers), label: 'draft beers' });
  if (f.uberRides >= 5) pills.push({ emoji: '🚕', value: formatNum(f.uberRides), label: 'Uber rides' });
  if (f.spotifyYears >= 1) pills.push({ emoji: '🎵', value: String(f.spotifyYears), label: 'yrs Spotify' });
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
  const cw = rx - lx; // content width

  // ── Header label ──
  ctx.font = '500 11px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '0.14em';
  ctx.fillText('TOTAL FEES PAID TO HYPERLIQUID', W / 2, 50);
  ctx.letterSpacing = '0';

  // ── Big number ──
  const feeParts = formatUSD(result.totalFees);
  ctx.font = '700 62px ui-monospace, "SF Mono", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(feeParts, W / 2, 110);

  // ── Period ──
  ctx.font = '400 13px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillText(period, W / 2, 134);

  // ── Rank badge area ──
  const rbY = 158, rbH = 70;
  ctx.fillStyle = 'rgba(30,241,125,0.05)';
  ctx.beginPath();
  ctx.roundRect(lx, rbY, cw, rbH, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,241,125,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Rank text left
  ctx.font = '400 13px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'left';
  ctx.fillText(`👑  Global rank`, lx + 18, rbY + 24);
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = tokens.colors.accent;
  ctx.fillText(`#${rankInfo.rank.toLocaleString()}`, lx + 140, rbY + 24);
  ctx.font = '400 12px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText(`out of ${rankInfo.total.toLocaleString()} traders`, lx + 18, rbY + 42);

  // Top percent right
  ctx.font = '700 22px ui-monospace, monospace';
  ctx.fillStyle = tokens.colors.accent;
  ctx.textAlign = 'right';
  ctx.fillText(`Top ${rankInfo.topPercent}%`, rx - 18, rbY + 30);

  // Percentile bar
  const pbX = lx + 18, pbY = rbY + 54, pbW = cw - 36, pbH = 5;
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath(); ctx.roundRect(pbX, pbY, pbW, pbH, 3); ctx.fill();
  const grad = ctx.createLinearGradient(pbX, 0, pbX + pbW * (rankInfo.percentile / 100), 0);
  grad.addColorStop(0, 'rgba(30,241,125,0.2)');
  grad.addColorStop(1, tokens.colors.accent);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(pbX, pbY, pbW * (rankInfo.percentile / 100), pbH, 3); ctx.fill();

  // Dot
  const dotX = pbX + pbW * (rankInfo.percentile / 100);
  ctx.fillStyle = tokens.colors.accent;
  ctx.beginPath(); ctx.arc(dotX, pbY + 2.5, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = tokens.colors.bg;
  ctx.beginPath(); ctx.arc(dotX, pbY + 2.5, 3, 0, Math.PI * 2); ctx.fill();

  // ── 4 Stat cards (2×2) ──
  const statCards = pickStatCards(funFacts);
  const gridY = rbY + rbH + 14;
  const gap = 10;
  const cardW = (cw - gap) / 2;
  const cardH = 72;

  statCards.forEach((card, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const cx = lx + col * (cardW + gap);
    const cy = gridY + row * (cardH + gap);

    // Card bg
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.beginPath(); ctx.roundRect(cx, cy, cardW, cardH, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Emoji
    ctx.font = `${20}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(card.emoji, cx + 16, cy + 30);

    // Value + unit
    ctx.font = '700 22px ui-monospace, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(card.value, cx + 48, cy + 30);
    const valW = ctx.measureText(card.value).width;
    ctx.font = '500 12px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(card.unit, cx + 48 + valW + 4, cy + 30);

    // Label
    ctx.font = '500 11px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(card.label, cx + 48, cy + 50);

    // Description
    ctx.font = '400 10px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText(card.description, cx + 48, cy + 64);
  });

  // ── Inline stat cards ──
  const inlineY = gridY + 2 * (cardH + gap) + 4;
  const inlineH = 40;

  // Burritos line
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  ctx.beginPath(); ctx.roundRect(lx, inlineY, cw, inlineH, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.stroke();

  ctx.textAlign = 'left';
  let tx = lx + 16;
  ctx.font = '16px system-ui'; ctx.fillStyle = '#fff';
  ctx.fillText('🌯', tx, inlineY + 26); tx += 32;
  ctx.font = '500 14px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText("That's", tx, inlineY + 26); tx += ctx.measureText("That's").width + 8;
  ctx.font = '700 15px ui-monospace, monospace'; ctx.fillStyle = '#fff';
  ctx.fillText(formatNum(funFacts.burritos), tx, inlineY + 26); tx += ctx.measureText(formatNum(funFacts.burritos)).width + 8;
  ctx.font = '500 14px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('Chipotle burritos', tx, inlineY + 26); tx += ctx.measureText('Chipotle burritos').width + 12;
  ctx.font = '400 13px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.25)';
  const burritoDays = Math.round(funFacts.burritos);
  ctx.fillText(`· lunch every day for ${yearsLabel(burritoDays)}`, tx, inlineY + 26);

  // Daily fee line
  const inline2Y = inlineY + inlineH + gap;
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  ctx.beginPath(); ctx.roundRect(lx, inline2Y, cw, inlineH, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.stroke();

  tx = lx + 16;
  ctx.font = '16px system-ui'; ctx.fillStyle = '#fff';
  ctx.fillText('💸', tx, inline2Y + 26); tx += 32;
  ctx.font = '500 14px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('Paying', tx, inline2Y + 26); tx += ctx.measureText('Paying').width + 8;
  ctx.font = '700 15px ui-monospace, monospace'; ctx.fillStyle = '#fff';
  const dailyStr = `$${funFacts.dailyFee}`;
  ctx.fillText(dailyStr, tx, inline2Y + 26); tx += ctx.measureText(dailyStr).width + 6;
  ctx.font = '500 14px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('/day to Hyperliquid', tx, inline2Y + 26); tx += ctx.measureText('/day to Hyperliquid').width + 8;
  ctx.font = '14px system-ui'; ctx.fillStyle = '#fff';
  ctx.fillText('🫡', tx, inline2Y + 26); tx += 24;
  if (funFacts.netflixMultiple >= 2) {
    ctx.font = '400 13px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText(`· ${funFacts.netflixMultiple}x your Netflix sub`, tx, inline2Y + 26);
  }

  // ── Pills row ──
  const pills = pickPills(funFacts);
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
  ctx.fillText('hypefees.com · powered by degen energy', lx, H - 28);
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
  const statCards = pickStatCards(funFacts);
  const pills = pickPills(funFacts);
  const feeStr = formatUSD(result.totalFees).replace('$', '');

  const handleDownload = useCallback(() => {
    generateImage(result, shortAddr, period, rankInfo, funFacts);
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
          onClick={() => setOpen(true)}
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
          <span className="text-xs text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors shrink-0">
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

          {/* Modal content — wide, no scroll */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              maxWidth: 820,
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
                {/* Row 1: Hero number + Rank side by side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }}>
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
                      Total fees paid to Hyperliquid
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
                    >
                      <PercentileBar percent={rankInfo.percentile} />
                    </RankBadge>
                  </div>
                </div>

                {/* Row 2: 4 stat cards in one row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
                  {statCards.map((card, i) => (
                    <StatCard key={i} {...card} />
                  ))}
                </div>

                {/* Row 3: two inline stat cards side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <InlineStatCard
                    style={{ gridColumn: 'auto' }}
                    segments={[
                      { type: 'emoji', content: '🌯' },
                      { type: 'text', content: "That's" },
                      { type: 'number', content: formatNum(Math.max(1, funFacts.burritos)) },
                      { type: 'text', content: funFacts.burritos > 1 ? 'Chipotle burritos' : 'Chipotle burrito' },
                      { type: 'muted', content: `· ${yearsLabel(funFacts.burritos)}` },
                    ]}
                  />
                  <InlineStatCard
                    style={{ gridColumn: 'auto' }}
                    segments={[
                      { type: 'emoji', content: '💸' },
                      { type: 'text', content: 'Paying' },
                      { type: 'number', content: `$${funFacts.dailyFee}` },
                      { type: 'text', content: '/day' },
                      { type: 'emoji', content: '🫡', size: 'sm' },
                      ...(funFacts.netflixMultiple >= 2
                        ? [{ type: 'muted' as const, content: `· ${funFacts.netflixMultiple}x Netflix` }]
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
                      hypefees.com
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
                2400×1350 · optimized for Twitter
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
