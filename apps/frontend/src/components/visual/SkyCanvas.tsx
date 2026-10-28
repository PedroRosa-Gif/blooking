import { Starfield } from './Starfield';

/**
 * Fixed full-bleed night sky behind the whole page. Back to front:
 *  1. vertical gradient (near-black zenith to a deep blue horizon)
 *  2. the starfield (dark theme only)
 *  3. a very faint warm glow at the horizon (a distant lamp)
 */
export function SkyCanvas() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'var(--sky)' }} />
      <div className="absolute inset-0">
        <Starfield />
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-[40vh]"
        style={{
          background: 'radial-gradient(110% 90% at 50% 130%, var(--horizon), transparent 62%)',
        }}
      />
    </div>
  );
}
