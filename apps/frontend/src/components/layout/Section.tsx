import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'sky' | 'solid';

/**
 * A full-bleed page band.
 *  - `sky`:   transparent, the fixed night sky shows through.
 *  - `solid`: a flat tonal band whose top and bottom edges dissolve into the
 *             sky (see `.band` in index.css). Alternating the two gives the
 *             sky, quiet, sky rhythm without borders or blur.
 * Solid bands should keep at least 96px of vertical padding so content stays
 * clear of the fade zones.
 */
export function Section({
  tone = 'sky',
  id,
  className,
  children,
}: {
  tone?: Tone;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn('relative scroll-mt-16', tone === 'solid' && 'band', className)}>
      <div className="mx-auto w-full max-w-[1200px] px-6">{children}</div>
    </section>
  );
}
