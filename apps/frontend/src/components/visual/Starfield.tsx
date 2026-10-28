import { useEffect, useRef } from 'react';

const TAU = Math.PI * 2;

/** Deterministic PRNG so the sky is identical on every load and resize. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Star colours by spectral type: mostly blue-white and white, a few warm. */
const STAR_COLORS = [
  '#ffffff',
  '#ffffff',
  '#eaf1ff',
  '#d6e4ff',
  '#bcd3ff',
  '#a9c4ff',
  '#fff4e2',
  '#ffe6c2',
  '#ffd2a1',
];

interface NearStar {
  x: number; // 0..1
  y: number; // 0..1
  r: number;
  alpha: number;
  twinkle: number;
  speed: number;
  phase: number;
  depth: number; // parallax factor 0..1
  color: string;
  bright: boolean;
}

interface Shooting {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  life: number;
}

/**
 * Realistic night sky on a <canvas>.
 *
 * Layers (back to front):
 *  1. Milky Way: a diagonal band of dense faint stars plus soft dust glows.
 *  2. Far field: thousands of sub-pixel stars, drawn once, wrapped for parallax.
 *  3. Near field: ~100 individually twinkling stars; a few bright ones get a
 *     soft halo and thin diffraction spikes.
 *  4. An occasional shooting star.
 *
 * Only the dark theme shows stars. Reduced motion renders one static frame.
 */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const root = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0;
    let H = 0;
    let GH = 0; // galaxy layer height (taller than the viewport for parallax)
    let dpr = 1;
    let raf = 0;
    let running = false;
    let resizeTimer = 0;
    let far: HTMLCanvasElement | null = null;
    let galaxy: HTMLCanvasElement | null = null;
    let near: NearStar[] = [];
    let shooting: Shooting | null = null;
    let nextShot = 0;
    let scrollY = window.scrollY;

    const isDark = () => root.getAttribute('data-theme') !== 'light';

    function makeLayer(w: number, h: number) {
      const layer = document.createElement('canvas');
      layer.width = Math.max(1, Math.floor(w * dpr));
      layer.height = Math.max(1, Math.floor(h * dpr));
      const c = layer.getContext('2d');
      if (!c) return null;
      c.scale(dpr, dpr);
      return { layer, c };
    }

    function gauss(rand: () => number) {
      // Box-Muller
      const u = Math.max(rand(), 1e-9);
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * rand());
    }

    function pick(rand: () => number) {
      return STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)];
    }

    function buildFar() {
      const made = makeLayer(W, H);
      if (!made) return;
      const { layer, c } = made;
      const rand = mulberry32(11);
      const count = Math.min(1500, Math.floor((W * H) / 1000));
      for (let i = 0; i < count; i++) {
        const m = rand();
        // Power-law-ish: most stars are tiny and dim, few are noticeable.
        const r = 0.28 + m * m * m * 0.7;
        c.globalAlpha = 0.16 + m * 0.55;
        c.fillStyle = pick(rand);
        c.beginPath();
        c.arc(rand() * W, rand() * H, r, 0, TAU);
        c.fill();
      }
      far = layer;
    }

    function buildGalaxy() {
      GH = Math.round(H * 1.35);
      const made = makeLayer(W, GH);
      if (!made) return;
      const { layer, c } = made;
      const rand = mulberry32(29);

      // Band runs from lower-left to upper-right.
      const x0 = -0.1 * W;
      const y0 = 0.82 * GH;
      const x1 = 1.1 * W;
      const y1 = 0.18 * GH;
      const len = Math.hypot(x1 - x0, y1 - y0);
      const ux = (x1 - x0) / len;
      const uy = (y1 - y0) / len;
      const nx = -uy;
      const ny = ux;
      const sigma = Math.min(W, H) * 0.12;

      // Dust glow first, additive, very soft.
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 18; i++) {
        const t = len / 2 + gauss(rand) * len * 0.26;
        const p = gauss(rand) * sigma * 0.55;
        const cx = x0 + ux * t + nx * p;
        const cy = y0 + uy * t + ny * p;
        const rad = 110 + rand() * 230;
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, rad);
        const a = 0.022 + rand() * 0.03;
        g.addColorStop(0, `rgba(150, 175, 235, ${a})`);
        g.addColorStop(1, 'rgba(150, 175, 235, 0)');
        c.fillStyle = g;
        c.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
      }
      c.globalCompositeOperation = 'source-over';

      // Dense faint stars concentrated along the band.
      const count = Math.min(2600, Math.floor((W * GH) / 650));
      for (let i = 0; i < count; i++) {
        const t = len / 2 + gauss(rand) * len * 0.27;
        const p = gauss(rand) * sigma;
        const x = x0 + ux * t + nx * p;
        const y = y0 + uy * t + ny * p;
        if (x < 0 || x > W || y < 0 || y > GH) continue;
        const m = rand();
        c.globalAlpha = 0.08 + m * m * 0.4;
        c.fillStyle = pick(rand);
        c.beginPath();
        c.arc(x, y, 0.28 + m * 0.4, 0, TAU);
        c.fill();
      }
      galaxy = layer;
    }

    function buildNear() {
      const rand = mulberry32(53);
      const n = Math.min(130, Math.max(50, Math.floor((W * H) / 9000)));
      near = Array.from({ length: n }, (_, i) => {
        const bright = i < 7;
        const m = rand();
        return {
          x: rand(),
          y: rand(),
          r: bright ? 1.4 + rand() * 0.6 : 0.5 + m * m * 0.8,
          alpha: bright ? 0.9 : 0.35 + rand() * 0.5,
          twinkle: bright ? 0.3 : 0.2 + rand() * 0.5,
          speed: 0.6 + rand() * 2.4,
          phase: rand() * TAU,
          depth: rand(),
          color: pick(rand),
          bright,
        };
      });
    }

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas!.clientWidth;
      H = canvas!.clientHeight;
      canvas!.width = Math.floor(W * dpr);
      canvas!.height = Math.floor(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGalaxy();
      buildFar();
      buildNear();
    }

    function drawShooting(now: number) {
      if (!shooting) return;
      const age = now - shooting.born;
      if (age > shooting.life) {
        shooting = null;
        nextShot = now + 9000 + Math.random() * 9000;
        return;
      }
      const k = age / shooting.life;
      const headX = shooting.x + shooting.vx * age;
      const headY = shooting.y + shooting.vy * age;
      const tail = 150;
      const speed = Math.hypot(shooting.vx, shooting.vy);
      const tx = headX - (shooting.vx / speed) * tail;
      const ty = headY - (shooting.vy / speed) * tail;
      const g = ctx!.createLinearGradient(tx, ty, headX, headY);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(255,255,255,0.9)');
      ctx!.globalAlpha = Math.sin(k * Math.PI);
      ctx!.strokeStyle = g;
      ctx!.lineWidth = 1.2;
      ctx!.lineCap = 'round';
      ctx!.beginPath();
      ctx!.moveTo(tx, ty);
      ctx!.lineTo(headX, headY);
      ctx!.stroke();
      ctx!.globalAlpha = 1;
    }

    function draw(now: number) {
      ctx!.clearRect(0, 0, W, H);
      if (!isDark()) return;
      const t = reduced ? 0 : now / 1000;
      const sy = reduced ? 0 : scrollY;

      if (galaxy) {
        const off = Math.min(sy * 0.05, GH - H);
        ctx!.drawImage(galaxy, 0, -off, W, GH);
      }
      if (far) {
        const off = (sy * 0.03) % H;
        ctx!.drawImage(far, 0, -off, W, H);
        ctx!.drawImage(far, 0, H - off, W, H);
      }

      for (const s of near) {
        const y = (((s.y * H - sy * (0.04 + s.depth * 0.09)) % H) + H) % H;
        const x = s.x * W;
        // Scintillation: two incommensurate sines read as natural flicker.
        const flicker =
          1 -
          s.twinkle *
            (0.5 + 0.5 * Math.sin(t * s.speed + s.phase)) *
            (0.6 + 0.4 * Math.sin(t * s.speed * 2.7 + s.phase * 1.3));
        const a = s.alpha * flicker;

        ctx!.globalAlpha = a;
        ctx!.fillStyle = s.color;
        ctx!.beginPath();
        ctx!.arc(x, y, s.r, 0, TAU);
        ctx!.fill();

        if (s.bright) {
          const halo = s.r * 7;
          const g = ctx!.createRadialGradient(x, y, 0, x, y, halo);
          g.addColorStop(0, s.color);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx!.globalAlpha = a * 0.28;
          ctx!.fillStyle = g;
          ctx!.fillRect(x - halo, y - halo, halo * 2, halo * 2);

          // Thin diffraction spikes.
          const spike = s.r * 9;
          ctx!.globalAlpha = a * 0.4;
          ctx!.strokeStyle = s.color;
          ctx!.lineWidth = 0.6;
          ctx!.beginPath();
          ctx!.moveTo(x - spike, y);
          ctx!.lineTo(x + spike, y);
          ctx!.moveTo(x, y - spike);
          ctx!.lineTo(x, y + spike);
          ctx!.stroke();
        }
      }
      ctx!.globalAlpha = 1;

      if (!reduced) {
        if (!shooting && now >= nextShot) {
          const angle = (22 + Math.random() * 14) * (Math.PI / 180);
          const speed = 0.8 + Math.random() * 0.5; // px per ms
          shooting = {
            x: W * (0.35 + Math.random() * 0.6),
            y: H * (0.05 + Math.random() * 0.3),
            vx: -Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            born: now,
            life: 700 + Math.random() * 400,
          };
        }
        drawShooting(now);
      }
    }

    function frame(now: number) {
      draw(now);
      raf = running ? requestAnimationFrame(frame) : 0;
    }

    function start() {
      if (running) return;
      if (reduced) {
        draw(0);
        return;
      }
      running = true;
      nextShot = performance.now() + 4000 + Math.random() * 5000;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
      ctx!.clearRect(0, 0, W, H);
    }

    function syncTheme() {
      if (isDark()) start();
      else stop();
    }

    const onScroll = () => {
      scrollY = window.scrollY;
    };
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        // Ignore small height changes (mobile URL bar) to avoid rebuild flicker.
        if (Math.abs(w - W) < 2 && Math.abs(h - H) < 80) return;
        build();
        if (reduced || !running) draw(0);
      }, 150);
    };

    build();
    syncTheme();
    if (reduced && isDark()) draw(0);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const observer = new MutationObserver(() => {
      syncTheme();
      if (reduced && isDark()) draw(0);
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="h-full w-full" />;
}
