import { useRef, useCallback } from 'react';
import type { FeeBreakdown } from '../lib/api';
import { formatUSD, formatVolume } from '../lib/fees';

function estimateRank(totalFees: number): { percentile: number; rank: string; title: string } {
  if (totalFees >= 100000) return { percentile: 99.9, rank: 'Top 0.1%', title: 'Legendary Degen' };
  if (totalFees >= 50000) return { percentile: 99.5, rank: 'Top 0.5%', title: 'Whale Status' };
  if (totalFees >= 10000) return { percentile: 99, rank: 'Top 1%', title: 'Fee Machine' };
  if (totalFees >= 5000) return { percentile: 97, rank: 'Top 3%', title: 'Heavy Hitter' };
  if (totalFees >= 1000) return { percentile: 90, rank: 'Top 10%', title: 'Serious Trader' };
  if (totalFees >= 500) return { percentile: 80, rank: 'Top 20%', title: 'Active Trader' };
  if (totalFees >= 100) return { percentile: 60, rank: 'Top 40%', title: 'Getting Started' };
  if (totalFees >= 10) return { percentile: 30, rank: 'Top 70%', title: 'Explorer' };
  return { percentile: 10, rank: 'Newcomer', title: 'Just Arrived' };
}

function getFunLines(totalFees: number, builderFees: number, volume: number, fillCount: number): string[] {
  const lines: string[] = [];
  const iphones = totalFees / 999;
  const coffees = totalFees / 5;
  const months = 14; // approx

  if (volume >= 1_000_000) lines.push(`You moved ${formatVolume(volume)} through Hyperliquid`);
  else lines.push(`${formatVolume(volume)} in total trading volume`);

  lines.push(`That's ${fillCount.toLocaleString()} trades across ~${months} months`);

  if (iphones >= 1) lines.push(`Your fees could buy ${iphones.toFixed(1)} iPhones`);
  else if (coffees >= 5) lines.push(`Your fees could buy ${Math.floor(coffees)} coffees`);

  if (builderFees > 0) {
    const pct = ((builderFees / totalFees) * 100).toFixed(0);
    lines.push(`${pct}% of your fees went to wallet builders`);
  }

  return lines;
}

function formatMonth(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

interface ShareCardProps {
  result: FeeBreakdown;
  address: string;
}

export default function ShareCard({ result, address }: ShareCardProps) {
  const { percentile, rank, title } = estimateRank(result.totalFees);
  const funLines = getFunLines(result.totalFees, result.builderFees, result.totalVolume, result.fillCount);
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const period = result.firstTradeTime && result.lastTradeTime
    ? `${formatMonth(result.firstTradeTime)} – ${formatMonth(result.lastTradeTime)}`
    : '';
  const barPct = Math.min(percentile, 99.9);

  const generateImage = useCallback(async () => {
    const W = 1200, H = 675;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Rounded clip
    const r = 40;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, r);
    ctx.clip();

    // BG gradient — Wrapped-style
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#041210');
    bgGrad.addColorStop(0.5, '#0a1f1a');
    bgGrad.addColorStop(1, '#061512');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Decorative circles
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#5ef0d0';
    ctx.beginPath(); ctx.arc(W * 0.85, H * 0.15, 200, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(W * 0.1, H * 0.85, 150, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    const lx = 80, rx = W - 80;

    // Header
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillStyle = '#5ef0d0';
    ctx.textAlign = 'left';
    ctx.fillText('HypeFees Wrapped', lx, 56);

    ctx.font = '400 12px ui-monospace, monospace';
    ctx.fillStyle = '#4a6b60';
    ctx.textAlign = 'right';
    ctx.fillText(`${shortAddr}  •  ${period}`, rx, 56);

    // Big number
    ctx.font = '800 72px system-ui, sans-serif';
    ctx.fillStyle = '#e8f0ec';
    ctx.textAlign = 'left';
    ctx.fillText(formatUSD(result.totalFees), lx, 150);

    ctx.font = '400 18px system-ui, sans-serif';
    ctx.fillStyle = '#6a8c80';
    ctx.fillText('in total fees paid on Hyperliquid', lx, 180);

    // Rank section (right side)
    ctx.font = '800 36px system-ui, sans-serif';
    ctx.fillStyle = '#5ef0d0';
    ctx.textAlign = 'right';
    ctx.fillText(rank, rx, 136);

    ctx.font = '500 14px system-ui, sans-serif';
    ctx.fillStyle = '#4a6b60';
    ctx.fillText(title, rx, 162);

    // Progress bar for rank
    const pBarX = rx - 240, pBarY = 175, pBarW = 240, pBarH = 6;
    ctx.fillStyle = '#1a3630';
    ctx.beginPath(); ctx.roundRect(pBarX, pBarY, pBarW, pBarH, 3); ctx.fill();
    ctx.fillStyle = '#5ef0d0';
    ctx.beginPath(); ctx.roundRect(pBarX, pBarY, pBarW * (barPct / 100), pBarH, 3); ctx.fill();

    // Fun lines — narrative style
    const startY = 230;
    funLines.forEach((line, i) => {
      const y = startY + i * 38;

      // Number circle
      ctx.beginPath();
      ctx.arc(lx + 12, y + 2, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#132e28';
      ctx.fill();
      ctx.font = '700 11px system-ui, sans-serif';
      ctx.fillStyle = '#5ef0d0';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, lx + 12, y + 6);

      ctx.font = '500 17px system-ui, sans-serif';
      ctx.fillStyle = '#c8ddd5';
      ctx.textAlign = 'left';
      ctx.fillText(line, lx + 36, y + 6);
    });

    // Stats row
    const statsY = startY + funLines.length * 38 + 30;
    const stats = [
      { label: 'Volume', value: formatVolume(result.totalVolume) },
      { label: 'Trades', value: result.fillCount.toLocaleString() },
      { label: 'Exchange', value: formatUSD(result.hlFees) },
      { label: 'Builder', value: formatUSD(result.builderFees), highlight: result.builderFees > 0 },
    ];

    const statW = (rx - lx) / stats.length;
    stats.forEach((s, i) => {
      const sx = lx + i * statW;
      ctx.font = '400 11px system-ui, sans-serif';
      ctx.fillStyle = '#4a6b60';
      ctx.textAlign = 'left';
      ctx.fillText(s.label, sx, statsY);

      ctx.font = '700 22px system-ui, sans-serif';
      ctx.fillStyle = s.highlight ? '#f59e0b' : '#e8f0ec';
      ctx.fillText(s.value, sx, statsY + 28);
    });

    // Fee bar
    const fbY = statsY + 56;
    const fbW = rx - lx, fbH = 8;
    ctx.fillStyle = '#1a3630';
    ctx.beginPath(); ctx.roundRect(lx, fbY, fbW, fbH, 4); ctx.fill();
    const exW = (result.hlFees / result.totalFees) * fbW;
    ctx.fillStyle = '#00c9a7';
    ctx.beginPath(); ctx.roundRect(lx, fbY, exW, fbH, 4); ctx.fill();
    if (result.builderFees > 0) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.roundRect(lx + exW - 2, fbY, fbW - exW + 2, fbH, 4); ctx.fill();
    }

    // Savings CTA
    if (result.builderFees > 0) {
      const ctaY = fbY + 32;
      ctx.font = '600 16px system-ui, sans-serif';
      ctx.fillStyle = '#5ef0d0';
      ctx.textAlign = 'left';
      ctx.fillText(`💡 Switch to 0% fee — save ${formatUSD(result.builderFees)} next time`, lx, ctaY);
    }

    // Footer
    ctx.font = '500 13px system-ui, sans-serif';
    ctx.fillStyle = '#2a4a42';
    ctx.textAlign = 'left';
    ctx.fillText('hypefees.com', lx, H - 36);

    ctx.font = '400 11px system-ui, sans-serif';
    ctx.fillStyle = '#1d3b37';
    ctx.textAlign = 'right';
    ctx.fillText('Check your fees at hypefees.com', rx, H - 36);

    // Border
    ctx.strokeStyle = '#1d3b37';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(0.5, 0.5, W - 1, H - 1, r); ctx.stroke();

    // Download
    const link = document.createElement('a');
    link.download = `hypefees-wrapped-${shortAddr}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [result, address, shortAddr, period, rank, title, barPct, funLines]);

  return (
    <div className="mt-8">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden">
        {/* Wrapped-style header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-[var(--color-accent)] mb-1">Your Hyperliquid Wrapped</div>
              <div className="text-3xl md:text-4xl font-extrabold tabular-nums tracking-tight">
                {formatUSD(result.totalFees)}
              </div>
              <div className="text-sm text-[var(--color-text-muted)] mt-0.5">in total fees</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-[var(--color-accent)]">{rank}</div>
              <div className="text-xs text-[var(--color-text-muted)]">{title}</div>
              {/* Rank bar */}
              <div className="mt-2 w-32 h-1.5 rounded-full bg-[var(--color-bg-elevated)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-1000"
                  style={{ width: `${barPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Narrative lines */}
        <div className="px-6 pb-4 space-y-2">
          {funLines.map((line, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]">{line}</span>
            </div>
          ))}
        </div>

        {/* Action row */}
        <div className="px-6 pb-6 flex flex-wrap items-center gap-3">
          <button
            onClick={generateImage}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl bg-[var(--color-text)] text-[var(--color-bg)] text-sm font-medium hover:opacity-85 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download Wrapped Card
          </button>
          <span className="text-xs text-[var(--color-text-muted)]">1200×675 · optimized for Twitter</span>
        </div>
      </div>
    </div>
  );
}
