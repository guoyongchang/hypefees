import { useEffect, useRef } from 'react';

const BUILDERS = [
  { name: 'OneKey',   fee: '0%',     rate: 0,       color: '#00e59b', best: true },
  { name: 'Axiom',    fee: '0.01%',  rate: 0.0001,  color: '#3b82f6', best: false },
  { name: 'Rabby',    fee: '0.02%',  rate: 0.0002,  color: '#8b5cf6', best: false },
  { name: 'Phantom',  fee: '0.05%',  rate: 0.0005,  color: '#f59e0b', best: false },
  { name: 'MetaMask', fee: '0.10%',  rate: 0.001,   color: '#ef4444', best: false },
];

const PARTICLE_COUNT = 140;

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
      const leftX = Math.max(70, W * 0.08);
      const rightX = W - Math.max(70, W * 0.08);
      const midX = W / 2;
      const padY = 40;
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
      const w = isEnd ? 106 : 120;
      const h = isEnd ? 44 : 50;

      ctx!.save();
      roundRect(ctx!, x - w / 2, y - h / 2, w, h, 10);
      if (isBest) {
        ctx!.shadowColor = 'rgba(0,229,155,0.3)';
        ctx!.shadowBlur = 24;
      }
      ctx!.fillStyle = isBest ? 'rgba(0,229,155,0.1)' : 'rgba(255,255,255,0.025)';
      ctx!.fill();
      ctx!.strokeStyle = isBest ? 'rgba(0,229,155,0.4)' : 'rgba(255,255,255,0.07)';
      ctx!.lineWidth = isBest ? 1.5 : 0.5;
      ctx!.stroke();
      ctx!.shadowColor = 'transparent';
      ctx!.shadowBlur = 0;
      ctx!.restore();

      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.font = '500 13px "Roobert", system-ui, sans-serif';
      ctx!.fillStyle = isBest ? '#00e59b' : '#e8e6e1';
      ctx!.fillText(label, x, sub ? y - 7 : y);

      if (sub) {
        ctx!.font = '600 11px ui-monospace, monospace';
        ctx!.fillStyle = isBest ? '#00e59b' : color;
        ctx!.globalAlpha = isBest ? 1 : 0.65;
        ctx!.fillText(sub, x, y + 10);
        ctx!.globalAlpha = 1;
      }

      if (isBest) {
        const bx = x + w / 2 - 4;
        const by = y - h / 2 - 6;
        ctx!.font = '700 8px "Roobert", system-ui, sans-serif';
        const tw = ctx!.measureText('BEST').width + 12;
        ctx!.fillStyle = '#00e59b';
        roundRect(ctx!, bx - tw / 2, by - 9, tw, 18, 5);
        ctx!.fill();
        ctx!.fillStyle = '#08080c';
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'middle';
        ctx!.fillText('BEST', bx, by);
      }
    }

    function draw() {
      timeRef.current += 0.016;
      ctx!.clearRect(0, 0, W, H);

      const { leftX, rightX, nodes, userY, hlY } = getLayout();

      // Draw path curves
      for (const node of nodes) {
        const a = node.best ? 0.18 : 0.045;
        const lw = node.best ? 1.8 : 0.7;

        // Left curve: user → frontend
        ctx!.beginPath();
        ctx!.moveTo(leftX + 53, userY);
        const cp1 = leftX + 53 + (node.x - 60 - leftX - 53) * 0.5;
        ctx!.bezierCurveTo(cp1, userY, cp1, node.y, node.x - 60, node.y);
        ctx!.strokeStyle = node.color;
        ctx!.globalAlpha = a;
        ctx!.lineWidth = lw;
        ctx!.stroke();
        ctx!.globalAlpha = 1;

        // Right curve: frontend → HL
        ctx!.beginPath();
        ctx!.moveTo(node.x + 60, node.y);
        const cp2 = node.x + 60 + (rightX - 53 - node.x - 60) * 0.5;
        ctx!.bezierCurveTo(cp2, node.y, cp2, hlY, rightX - 53, hlY);
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
          const sx = leftX + 53, sy = userY;
          const ex = node.x - 60, ey = node.y;
          const cpx = sx + (ex - sx) * 0.5;
          px = cubicBezier(p.t, sx, cpx, cpx, ex);
          py = cubicBezier(p.t, sy, sy, ey, ey);
        } else {
          const sx = node.x + 60, sy = node.y;
          const ex = rightX - 53, ey = hlY;
          const cpx = sx + (ex - sx) * 0.5;
          px = cubicBezier(p.t, sx, cpx, cpx, ex);
          py = cubicBezier(p.t, sy, sy, ey, ey);
        }

        const alpha = node.best ? (0.55 + 0.45 * Math.sin(p.t * Math.PI)) : 0.2;
        const sz = node.best ? p.size * 1.4 : p.size * 0.7;

        ctx!.beginPath();
        ctx!.arc(px, py, sz, 0, Math.PI * 2);
        ctx!.fillStyle = node.color;
        ctx!.globalAlpha = alpha;
        ctx!.fill();
        ctx!.globalAlpha = 1;

        if (node.best) {
          ctx!.beginPath();
          ctx!.arc(px, py, sz * 3.5, 0, Math.PI * 2);
          ctx!.fillStyle = node.color;
          ctx!.globalAlpha = 0.05;
          ctx!.fill();
          ctx!.globalAlpha = 1;
        }
      }

      // Nodes
      drawNode(leftX, userY, 'Your Trade', '$10,000', '#e8e6e1', false, true);
      for (const node of nodes) {
        drawNode(node.x, node.y, node.name, node.fee, node.color, node.best, false);
      }
      drawNode(rightX, hlY, 'Hyperliquid', 'L1', '#e8e6e1', false, true);

      // Savings callout
      const best = nodes.find((n) => n.best);
      const worst = nodes[nodes.length - 1];
      if (best && worst) {
        const save = ((worst.rate - best.rate) * 10000).toFixed(0);
        const cx = best.x, cy = best.y - 42;
        const pulse = 0.8 + 0.2 * Math.sin(timeRef.current * 2.5);

        ctx!.save();
        ctx!.globalAlpha = pulse;
        ctx!.font = '600 11px ui-monospace, monospace';
        const txt = `Save $${save} per $10k`;
        const tw = ctx!.measureText(txt).width + 24;
        ctx!.fillStyle = 'rgba(0,229,155,0.1)';
        roundRect(ctx!, cx - tw / 2, cy - 13, tw, 26, 7);
        ctx!.fill();
        ctx!.strokeStyle = 'rgba(0,229,155,0.25)';
        ctx!.lineWidth = 0.5;
        ctx!.stroke();
        ctx!.fillStyle = '#00e59b';
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

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[340px] md:h-[400px]"
      style={{ background: 'transparent' }}
    />
  );
}
