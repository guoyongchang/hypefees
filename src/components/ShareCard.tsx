import { useRef, useCallback } from 'react';
import type { FeeBreakdown } from '../lib/api';
import { formatUSD, formatVolume } from '../lib/fees';

// ~442K total HL traders, power-law distribution
// We estimate rank percentile from total fees paid
function estimateRank(totalFees: number): { percentile: number; rank: string } {
  // Rough distribution: most traders pay < $50, whales pay $100K+
  // Using log-normal approximation
  if (totalFees >= 100000) return { percentile: 99.9, rank: 'Top 0.1%' };
  if (totalFees >= 50000) return { percentile: 99.5, rank: 'Top 0.5%' };
  if (totalFees >= 10000) return { percentile: 99, rank: 'Top 1%' };
  if (totalFees >= 5000) return { percentile: 97, rank: 'Top 3%' };
  if (totalFees >= 1000) return { percentile: 90, rank: 'Top 10%' };
  if (totalFees >= 500) return { percentile: 80, rank: 'Top 20%' };
  if (totalFees >= 100) return { percentile: 60, rank: 'Top 40%' };
  if (totalFees >= 10) return { percentile: 30, rank: 'Top 70%' };
  return { percentile: 10, rank: 'Newcomer' };
}

// Fun equivalents
function getFunFacts(totalFees: number): { emoji: string; text: string }[] {
  const facts: { emoji: string; text: string }[] = [];
  const iphones = totalFees / 999;
  const coffees = totalFees / 5;
  const teslas = totalFees / 35000;
  const btc = totalFees / 85000;
  const flights = totalFees / 800;

  if (iphones >= 1) facts.push({ emoji: '📱', text: `${iphones.toFixed(1)} iPhones` });
  if (teslas >= 0.1) facts.push({ emoji: '🚗', text: `${(teslas * 100).toFixed(0)}% of a Tesla` });
  if (teslas >= 1) facts[facts.length - 1] = { emoji: '🚗', text: `${teslas.toFixed(1)} Teslas` };
  if (btc >= 0.01) facts.push({ emoji: '₿', text: `${btc.toFixed(3)} BTC` });
  if (flights >= 1) facts.push({ emoji: '✈️', text: `${flights.toFixed(0)} round-trip flights` });
  if (coffees >= 1 && totalFees < 100) facts.push({ emoji: '☕', text: `${coffees.toFixed(0)} coffees` });

  return facts.slice(0, 3);
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

interface ShareCardProps {
  result: FeeBreakdown;
  address: string;
}

export default function ShareCard({ result, address }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { percentile, rank } = estimateRank(result.totalFees);
  const funFacts = getFunFacts(result.totalFees);
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const period = result.firstTradeTime && result.lastTradeTime
    ? `${formatDate(result.firstTradeTime)} – ${formatDate(result.lastTradeTime)}`
    : '';

  const generateImage = useCallback(async () => {
    const card = cardRef.current;
    if (!card) return;

    // Twitter optimal: 1200x675 (16:9)
    const W = 1200, H = 675;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#0a1a1a';
    ctx.fillRect(0, 0, W, H);

    // Rounded corners clip
    const r = 32;
    ctx.beginPath();
    ctx.moveTo(r, 0); ctx.lineTo(W - r, 0); ctx.quadraticCurveTo(W, 0, W, r);
    ctx.lineTo(W, H - r); ctx.quadraticCurveTo(W, H, W - r, H);
    ctx.lineTo(r, H); ctx.quadraticCurveTo(0, H, 0, H - r);
    ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath(); ctx.clip();

    // Re-fill after clip
    ctx.fillStyle = '#0a1a1a';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(94,240,208,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Gradient accent at top
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, 'rgba(0,201,167,0.15)');
    grad.addColorStop(1, 'rgba(0,201,167,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 4);

    const lx = 72, rx = W - 72;

    // Title row
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.fillStyle = '#5ef0d0';
    ctx.textAlign = 'left';
    ctx.fillText('HypeFees', lx, 52);

    ctx.font = '400 13px ui-monospace, monospace';
    ctx.fillStyle = '#5e7e72';
    ctx.textAlign = 'right';
    ctx.fillText(shortAddr, rx, 52);

    // Divider
    ctx.strokeStyle = '#1d3b37';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(lx, 72); ctx.lineTo(rx, 72); ctx.stroke();

    // Main stat: Total Fees
    ctx.font = '700 56px system-ui, sans-serif';
    ctx.fillStyle = '#e8f0ec';
    ctx.textAlign = 'left';
    ctx.fillText(formatUSD(result.totalFees), lx, 140);

    ctx.font = '400 16px system-ui, sans-serif';
    ctx.fillStyle = '#5e7e72';
    ctx.fillText('total fees paid on Hyperliquid', lx, 168);

    // Rank badge
    ctx.font = '700 24px system-ui, sans-serif';
    ctx.fillStyle = '#5ef0d0';
    ctx.textAlign = 'right';
    ctx.fillText(rank, rx, 130);

    ctx.font = '400 13px system-ui, sans-serif';
    ctx.fillStyle = '#5e7e72';
    ctx.fillText(`Top ${(100 - percentile).toFixed(1)}% of all traders`, rx, 155);

    // Stats row
    const statsY = 220;
    const statItems = [
      { label: 'Volume', value: formatVolume(result.totalVolume) },
      { label: 'Trades', value: result.fillCount.toLocaleString() },
      { label: 'Exchange Fees', value: formatUSD(result.hlFees) },
      { label: 'Builder Fees', value: formatUSD(result.builderFees), color: result.builderFees > 0 ? '#f59e0b' : '#5ef0d0' },
    ];

    const statW = (rx - lx) / statItems.length;
    statItems.forEach((s, i) => {
      const sx = lx + i * statW;
      // Box
      ctx.fillStyle = '#132928';
      ctx.beginPath();
      const bw = statW - 12, bh = 72, br = 10;
      const bx = sx, by = statsY;
      ctx.moveTo(bx + br, by); ctx.lineTo(bx + bw - br, by); ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
      ctx.lineTo(bx + bw, by + bh - br); ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
      ctx.lineTo(bx + br, by + bh); ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
      ctx.lineTo(bx, by + br); ctx.quadraticCurveTo(bx, by, bx + br, by);
      ctx.closePath(); ctx.fill();

      ctx.font = '400 11px system-ui, sans-serif';
      ctx.fillStyle = '#5e7e72';
      ctx.textAlign = 'left';
      ctx.fillText(s.label, sx + 14, statsY + 24);

      ctx.font = '700 20px system-ui, sans-serif';
      ctx.fillStyle = s.color || '#e8f0ec';
      ctx.fillText(s.value, sx + 14, statsY + 52);
    });

    // Fee breakdown bar
    const barY = 320;
    ctx.fillStyle = '#5e7e72';
    ctx.font = '400 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Fee Breakdown', lx, barY);

    const barTop = barY + 14, barH = 10, barW = rx - lx;
    // BG
    ctx.fillStyle = '#1d3b37';
    ctx.beginPath();
    ctx.roundRect(lx, barTop, barW, barH, 5);
    ctx.fill();
    // Exchange portion
    const exW = (result.hlFees / result.totalFees) * barW;
    ctx.fillStyle = '#00c9a7';
    ctx.beginPath();
    ctx.roundRect(lx, barTop, exW, barH, 5);
    ctx.fill();
    // Builder portion
    if (result.builderFees > 0) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(lx + exW, barTop, barW - exW, barH);
    }

    // Legend
    ctx.fillStyle = '#00c9a7'; ctx.beginPath(); ctx.arc(lx + 5, barTop + 28, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#98b5aa'; ctx.font = '400 11px system-ui, sans-serif'; ctx.fillText(`Exchange ${formatUSD(result.hlFees)}`, lx + 14, barTop + 32);
    if (result.builderFees > 0) {
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(rx - 120, barTop + 28, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#98b5aa'; ctx.textAlign = 'left'; ctx.fillText(`Builder ${formatUSD(result.builderFees)}`, rx - 112, barTop + 32);
    }

    // Fun facts
    if (funFacts.length > 0) {
      const ffY = 410;
      ctx.fillStyle = '#5e7e72';
      ctx.font = '400 11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Your fees could have bought:', lx, ffY);

      funFacts.forEach((f, i) => {
        ctx.font = '500 18px system-ui, sans-serif';
        ctx.fillStyle = '#e8f0ec';
        ctx.fillText(`${f.emoji}  ${f.text}`, lx + i * 260, ffY + 30);
      });
    }

    // Savings callout
    if (result.builderFees > 0) {
      const cyY = 490;
      ctx.fillStyle = '#0d2e1a';
      ctx.beginPath();
      ctx.roundRect(lx, cyY, rx - lx, 56, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(34,197,94,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '600 15px system-ui, sans-serif';
      ctx.fillStyle = '#22c55e';
      ctx.textAlign = 'left';
      ctx.fillText(`You could have saved ${formatUSD(result.builderFees)} with a 0% fee builder`, lx + 20, cyY + 34);
    }

    // Footer
    ctx.font = '400 12px system-ui, sans-serif';
    ctx.fillStyle = '#3d5047';
    ctx.textAlign = 'left';
    ctx.fillText('hypefees.com', lx, H - 30);
    if (period) {
      ctx.textAlign = 'right';
      ctx.fillText(period, rx, H - 30);
    }

    // Border
    ctx.strokeStyle = '#1d3b37';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(r, 0); ctx.lineTo(W - r, 0); ctx.quadraticCurveTo(W, 0, W, r);
    ctx.lineTo(W, H - r); ctx.quadraticCurveTo(W, H, W - r, H);
    ctx.lineTo(r, H); ctx.quadraticCurveTo(0, H, 0, H - r);
    ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath(); ctx.stroke();

    // Download
    const link = document.createElement('a');
    link.download = `hypefees-${shortAddr}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [result, address, shortAddr, period, rank, percentile, funFacts]);

  return (
    <div className="mt-8">
      {/* On-page brag card */}
      <div ref={cardRef} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 space-y-5">
        {/* Rank + headline */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-[var(--color-text-muted)]">Your Hyperliquid fees</div>
            <div className="text-3xl font-bold mt-1 tabular-nums">{formatUSD(result.totalFees)}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-[var(--color-accent)] tabular-nums">{rank}</div>
            <div className="text-xs text-[var(--color-text-muted)]">
              Top {(100 - percentile).toFixed(1)}% of traders
            </div>
          </div>
        </div>

        {/* Fun equivalents */}
        {funFacts.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {funFacts.map((f, i) => (
              <div key={i} className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-elevated)] text-sm">
                <span className="mr-1.5">{f.emoji}</span>
                <span className="text-[var(--color-text-secondary)]">{f.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Share button */}
        <button
          onClick={generateImage}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl bg-[var(--color-text)] text-[var(--color-bg)] text-sm font-medium hover:opacity-85 transition-opacity"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M7 10l5 5 5-5M12 15V3" />
          </svg>
          Download Share Card
        </button>
        <p className="text-xs text-[var(--color-text-muted)]">
          Optimized for Twitter (1200×675). Share your trading stats.
        </p>
      </div>
    </div>
  );
}
