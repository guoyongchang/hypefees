import { useEffect, useRef } from 'react';

const BUILDERS = [
  { name: 'OneKey',   fee: '0%',     rate: 0,       color: '#00c9a7', best: true },
  { name: 'Axiom',    fee: '0.01%',  rate: 0.0001,  color: '#3b82f6', best: false },
  { name: 'Rabby',    fee: '0.02%',  rate: 0.0002,  color: '#8b5cf6', best: false },
  { name: 'Phantom',  fee: '0.05%',  rate: 0.0005,  color: '#f59e0b', best: false },
  { name: 'MetaMask', fee: '0.10%',  rate: 0.001,   color: '#ef4444', best: false },
];

const PARTICLE_COUNT = 120;

interface Particle {
  pathIndex: number;
  t: number;
  speed: number;
  side: 'left' | 'right';
  size: number;
}

function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function HeroFlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let W = 0, H = 0;

    // Theme-aware colors
    function getThemeColors() {
      const isDark = document.documentElement.classList.contains('dark');
      return {
        text: isDark ? '#ecf5f0' : '#0c1a1a',
        textDim: isDark ? '#6a8c80' : '#8a9aab',
        nodeBg: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)',
        nodeBorder: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
        bestBg: isDark ? 'rgba(0,201,167,0.1)' : 'rgba(0,201,167,0.08)',
        bestBorder: isDark ? 'rgba(0,201,167,0.4)' : 'rgba(0,201,167,0.35)',
        badgeBg: '#00c9a7',
        badgeText: isDark ? '#0a1a1a' : '#ffffff',
        saveBg: isDark ? 'rgba(0,201,167,0.1)' : 'rgba(0,201,167,0.08)',
        saveBorder: isDark ? 'rgba(0,201,167,0.25)' : 'rgba(0,201,167,0.2)',
      };
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initParticles() {
      particlesRef.current = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particlesRef.current.push({
          pathIndex: Math.floor(Math.random() * BUILDERS.length),
          t: Math.random(),
          speed: 0.0018 + Math.random() * 0.0035,
          side: Math.random() > 0.5 ? 'left' : 'right',
          size: 1 + Math.random() * 2,
        });
      }
    }

    function getLayout() {
      const leftX = Math.max(55, W * 0.07);
      const rightX = W - Math.max(55, W * 0.07);
      const midX = W / 2;
      const padY = 64; // enough room for BEST badge + savings callout above first node
      const gap = (H - padY * 2) / (BUILDERS.length - 1);
      const nodes = BUILDERS.map((f, i) => ({
        ...f, x: midX, y: padY + i * gap,
      }));
      return { leftX, rightX, midX, nodes, userY: H / 2, hlY: H / 2 };
    }

    function drawNode(
      x: number, y: number, label: string, sub: string | null,
      color: string, isBest: boolean, isEnd: boolean,
    ) {
      const theme = getThemeColors();
      const w = isEnd ? 100 : 114;
      const h = isEnd ? 42 : 48;

      ctx!.save();
      roundRect(ctx!, x - w / 2, y - h / 2, w, h, 10);
      if (isBest) {
        ctx!.shadowColor = 'rgba(0,201,167,0.25)';
        ctx!.shadowBlur = 20;
      }
      ctx!.fillStyle = isBest ? theme.bestBg : theme.nodeBg;
      ctx!.fill();
      ctx!.strokeStyle = isBest ? theme.bestBorder : theme.nodeBorder;
      ctx!.lineWidth = isBest ? 1.5 : 0.5;
      ctx!.stroke();
      ctx!.shadowColor = 'transparent';
      ctx!.shadowBlur = 0;
      ctx!.restore();

      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.font = '500 12px "Roobert", system-ui, sans-serif';
      ctx!.fillStyle = isBest ? '#00c9a7' : theme.text;
      ctx!.fillText(label, x, sub ? y - 7 : y);

      if (sub) {
        ctx!.font = '600 10px ui-monospace, monospace';
        ctx!.fillStyle = isBest ? '#00c9a7' : color;
        ctx!.globalAlpha = isBest ? 1 : 0.6;
        ctx!.fillText(sub, x, y + 9);
        ctx!.globalAlpha = 1;
      }

      if (isBest) {
        const bx = x + w / 2 - 4;
        const by = y - h / 2 - 5;
        ctx!.font = '700 7px "Roobert", system-ui, sans-serif';
        const tw = ctx!.measureText('BEST').width + 10;
        ctx!.fillStyle = theme.badgeBg;
        roundRect(ctx!, bx - tw / 2, by - 8, tw, 16, 4);
        ctx!.fill();
        ctx!.fillStyle = theme.badgeText;
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'middle';
        ctx!.fillText('BEST', bx, by);
      }
    }

    function draw() {
      timeRef.current += 0.016;
      ctx!.clearRect(0, 0, W, H);

      const theme = getThemeColors();
      const { leftX, rightX, nodes, userY, hlY } = getLayout();

      // Path curves
      for (const node of nodes) {
        const a = node.best ? 0.2 : 0.06;
        const lw = node.best ? 1.8 : 0.7;

        ctx!.beginPath();
        ctx!.moveTo(leftX + 50, userY);
        const cp1 = leftX + 50 + (node.x - 57 - leftX - 50) * 0.5;
        ctx!.bezierCurveTo(cp1, userY, cp1, node.y, node.x - 57, node.y);
        ctx!.strokeStyle = node.color;
        ctx!.globalAlpha = a;
        ctx!.lineWidth = lw;
        ctx!.stroke();
        ctx!.globalAlpha = 1;

        ctx!.beginPath();
        ctx!.moveTo(node.x + 57, node.y);
        const cp2 = node.x + 57 + (rightX - 50 - node.x - 57) * 0.5;
        ctx!.bezierCurveTo(cp2, node.y, cp2, hlY, rightX - 50, hlY);
        ctx!.strokeStyle = node.color;
        ctx!.globalAlpha = a;
        ctx!.lineWidth = lw;
        ctx!.stroke();
        ctx!.globalAlpha = 1;
      }

      // Particles
      for (const p of particlesRef.current) {
        p.t += p.speed;
        if (p.t > 1) {
          p.t -= 1;
          p.side = p.side === 'left' ? 'right' : 'left';
          if (p.side === 'left') p.pathIndex = Math.floor(Math.random() * BUILDERS.length);
        }

        const node = nodes[p.pathIndex];
        let px: number, py: number;

        if (p.side === 'left') {
          const sx = leftX + 50, sy = userY;
          const ex = node.x - 57, ey = node.y;
          const cpx = sx + (ex - sx) * 0.5;
          px = cubicBezier(p.t, sx, cpx, cpx, ex);
          py = cubicBezier(p.t, sy, sy, ey, ey);
        } else {
          const sx = node.x + 57, sy = node.y;
          const ex = rightX - 50, ey = hlY;
          const cpx = sx + (ex - sx) * 0.5;
          px = cubicBezier(p.t, sx, cpx, cpx, ex);
          py = cubicBezier(p.t, sy, sy, ey, ey);
        }

        const alpha = node.best ? (0.5 + 0.4 * Math.sin(p.t * Math.PI)) : 0.15;
        const sz = node.best ? p.size * 1.3 : p.size * 0.6;

        ctx!.beginPath();
        ctx!.arc(px, py, sz, 0, Math.PI * 2);
        ctx!.fillStyle = node.color;
        ctx!.globalAlpha = alpha;
        ctx!.fill();
        ctx!.globalAlpha = 1;

        if (node.best) {
          ctx!.beginPath();
          ctx!.arc(px, py, sz * 3, 0, Math.PI * 2);
          ctx!.fillStyle = node.color;
          ctx!.globalAlpha = 0.04;
          ctx!.fill();
          ctx!.globalAlpha = 1;
        }
      }

      // Nodes
      drawNode(leftX, userY, 'Your Trade', '$10,000', theme.text, false, true);
      for (const node of nodes) {
        drawNode(node.x, node.y, node.name, node.fee, node.color, node.best, false);
      }
      drawNode(rightX, hlY, 'Hyperliquid', 'L1', theme.text, false, true);

      // Savings callout
      const best = nodes.find((n) => n.best);
      const worst = nodes[nodes.length - 1];
      if (best && worst) {
        const save = ((worst.rate - best.rate) * 10000).toFixed(0);
        const cx = best.x, cy = best.y - 40;
        const pulse = 0.8 + 0.2 * Math.sin(timeRef.current * 2.5);

        ctx!.save();
        ctx!.globalAlpha = pulse;
        ctx!.font = '600 10px ui-monospace, monospace';
        const txt = `Save $${save} per $10k`;
        const tw = ctx!.measureText(txt).width + 20;
        ctx!.fillStyle = theme.saveBg;
        roundRect(ctx!, cx - tw / 2, cy - 11, tw, 22, 6);
        ctx!.fill();
        ctx!.strokeStyle = theme.saveBorder;
        ctx!.lineWidth = 0.5;
        ctx!.stroke();
        ctx!.fillStyle = '#00c9a7';
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'middle';
        ctx!.fillText(txt, cx, cy);
        ctx!.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    resize();
    initParticles();
    draw();

    // Re-render on theme change
    const observer = new MutationObserver(() => {});
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[340px] md:h-[420px]"
    />
  );
}
