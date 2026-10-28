import type { ReactNode } from 'react';

type Tone = 'accent' | 'surface' | 'muted';

const tones: Record<Tone, string> = {
  accent:
    'bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)] ' +
    'border border-[color-mix(in_srgb,var(--accent)_35%,transparent)]',
  surface: 'bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--hairline)]',
  muted: 'bg-transparent text-[var(--text-muted)] border border-[var(--hairline)]',
};

/** Small pill — eyebrow labels, genre chips, status badges. */
export function Pill({
  tone = 'surface',
  uppercase = false,
  children,
}: {
  tone?: Tone;
  uppercase?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-[var(--radius-tags)] px-[var(--spacing-12)] py-[var(--spacing-4)]',
        'text-[var(--text-caption)] font-semibold leading-none',
        uppercase ? 'uppercase tracking-[0.12em]' : '',
        tones[tone],
      ].join(' ')}
    >
      {children}
    </span>
  );
}
