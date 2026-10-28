import { useEffect, useMemo, useRef } from 'react';

/** Deterministic pseudo-random so the field is stable across renders. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Star {
  x: number; // 0..1
  y: number; // 0..1
  r: number; // px radius (small!)
  base: number; // base opacity
  amp: number; // twinkle amplitude
  phase: number;
  speed: number; // twinkle speed
  amber: boolean;
  layer: number; // parallax depth 0..1
}

/**
 * Night-sky star field rendered on a <canvas> for crisp, truly small stars
 * (real pixel radii, not stretched SVG). Three parallax depth layers drift at
 * different rates as you scroll, stars twinkle gently, and a few are amber.
 * Purely decorative and reduced-motion aware.
 */
export function Starfield({ density = 0.00022 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollY = useRef(0);
  const rafRef = useRef<number>(0);
  const seed = useMemo(() => 7, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let stars: Star[] = [];
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const amberRgb = () => {
      const styles = getComputedStyle(document.documentElement);
      const accent = styles.getPropertyValue('--accent').trim() || '#e8b059';
      const star = styles.getPropertyValue('--star-color').trim() || '#eaf1f8';
      return { accent, star };
    };
    let colors = amberRgb();

    function build() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(90, Math.floor(width * height * density));
      const rand = mulberry32(seed);
      stars = Array.from({ length: count }, () => {
        const layer = rand();
        const amber = rand() > 0.9;
        return {
          x: rand(),
          y: rand(),
          r: (amber ? 0.9 : 0.5) + rand() * (layer > 0.66 ? 1.3 : 0.7),
          base: 0.25 + rand() * 0.5,
          amp: 0.2 + rand() * 0.45,
          phase: rand() * Math.PI * 2,
          speed: 0.4 + rand() * 1.1,
          amber,
          layer,
        };
      });
      colors = amberRgb();
    }

    function draw(time: number) {
      ctx.clearRect(0, 0, width, height);
      const t = time / 1000;
      for (const s of stars) {
        // Parallax: deeper layers shift less with scroll.
        const parallax = (scrollY.current * (0.02 + s.layer * 0.06)) % (height + 60);
        const y = (s.y * height + parallax) % (height + 40) - 20;
        const twinkle = prefersReduced ? s.base : s.base + Math.sin(t * s.speed + s.phase) * s.amp;
        const alpha = Math.max(0.05, Math.min(1, twinkle));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.amber ? colors.accent : colors.star;
        ctx.beginPath();
        ctx.arc(s.x * width, y, s.r, 0, Math.PI * 2);
        ctx.fill();
        // subtle glow for the brighter/amber stars
        if (s.amber || s.r > 1.4) {
          ctx.globalAlpha = alpha * 0.25;
          ctx.beginPath();
          ctx.arc(s.x * width, y, s.r * 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (!prefersReduced) rafRef.current = requestAnimationFrame(draw);
    }

    const onScroll = () => {
      scrollY.current = window.scrollY;
    };
    const onResize = () => {
      build();
      if (prefersReduced) draw(0);
    };

    build();
    if (prefersReduced) {
      draw(0);
    } else {
      rafRef.current = requestAnimationFrame(draw);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    // Re-read theme colors when the theme toggles.
    const observer = new MutationObserver(() => {
      colors = amberRgb();
      if (prefersReduced) draw(0);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
    };
  }, [density, seed]);

  return <canvas ref={canvasRef} aria-hidden="true" className="h-full w-full" />;
}
