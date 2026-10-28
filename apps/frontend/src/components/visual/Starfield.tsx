import { useMemo } from 'react';

interface Star {
  cx: number;
  cy: number;
  r: number;
  delay: number;
  duration: number;
  bright: boolean;
}

/** Deterministic pseudo-random so SSR/CSR and re-renders stay stable. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Animated star field rendered as a single SVG, layered behind the hero.
 *
 * Stars twinkle (opacity) via CSS; brighter stars are a touch larger. The whole
 * field sits on the `--sky-gradient` background set by the parent. Purely
 * decorative — `aria-hidden`. Motion is disabled under prefers-reduced-motion
 * (handled globally in index.css).
 */
export function Starfield({ count = 140, seed = 7 }: { count?: number; seed?: number }) {
  const stars = useMemo<Star[]>(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, () => {
      const bright = rand() > 0.82;
      return {
        cx: rand() * 100,
        cy: rand() * 100,
        r: bright ? 1 + rand() * 0.8 : 0.4 + rand() * 0.7,
        delay: rand() * 4,
        duration: 3 + rand() * 4,
        bright,
      };
    });
  }, [count, seed]);

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill={s.bright ? 'var(--accent)' : 'var(--star-color)'}
          opacity={0.6}
          style={{
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </svg>
  );
}
