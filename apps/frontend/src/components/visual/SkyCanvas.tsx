import { Starfield } from './Starfield';

/**
 * Fixed, full-bleed night-sky canvas that sits behind the whole page — the
 * "painting is the connective tissue" idea from design_v2, reinterpreted as a
 * nocturnal sky. Layers, back to front:
 *   1. vertical gradient (deep blue → near-black)
 *   2. soft atmospheric nebula washes (very subtle)
 *   3. an amber horizon glow low on the page (lamp/moonlight)
 *   4. the animated starfield
 */
export function SkyCanvas() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden">
      {/* 1. base gradient */}
      <div className="absolute inset-0" style={{ background: 'var(--sky-gradient)' }} />

      {/* 2. atmospheric washes */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(60% 40% at 20% 15%, color-mix(in srgb, var(--accent) 7%, transparent), transparent 70%),' +
            'radial-gradient(50% 35% at 85% 25%, color-mix(in srgb, #4a79b5 12%, transparent), transparent 70%)',
        }}
      />

      {/* 4. stars */}
      <div className="absolute inset-0">
        <Starfield />
      </div>

      {/* 3. amber horizon glow */}
      <div
        className="absolute inset-x-0 bottom-0 h-[45vh]"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 120%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%)',
        }}
      />
    </div>
  );
}
