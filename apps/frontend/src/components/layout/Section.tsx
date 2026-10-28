import type { ReactNode } from 'react';

type Band = 'sky' | 'surface';

/**
 * A vertical page band. `sky` is transparent so the fixed night-sky shows
 * through; `surface` lays an elevated opaque band over the sky (the quiet
 * content sections). Alternating them creates design_v2's sky → quiet → sky
 * breathing rhythm. Inner content is centered to the 1200px max-width.
 */
export function Section({
  band = 'sky',
  id,
  className = '',
  children,
}: {
  band?: Band;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const bandClass =
    band === 'surface'
      ? 'bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] border-y border-[var(--hairline)] backdrop-blur-sm'
      : '';

  return (
    <section id={id} className={`relative w-full ${bandClass} ${className}`}>
      <div className="mx-auto w-full max-w-[1200px] px-[var(--spacing-24)]">{children}</div>
    </section>
  );
}
