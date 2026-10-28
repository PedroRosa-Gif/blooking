import type { ReactNode } from 'react';

type Tone = 'mint' | 'sky' | 'peach' | 'neutral';

const tones: Record<Tone, string> = {
  mint: 'bg-[var(--color-mint-wash)] text-[var(--color-portrait-ink)]',
  sky: 'bg-[var(--color-sky-wash)] text-[var(--color-portrait-ink)]',
  peach: 'bg-[var(--color-peach-wash)] text-[var(--color-portrait-ink)]',
  neutral: 'bg-[var(--color-mist-hairline)] text-[var(--color-graphite-body)]',
};

/** Small pastel-wash pill — eyebrow labels, genre chips, "New" badges. */
export function Pill({
  tone = 'sky',
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
        'inline-flex items-center rounded-[var(--radius-tags)] px-[var(--spacing-8)] py-[var(--spacing-4)]',
        'text-[var(--text-caption)] font-semibold leading-none',
        uppercase ? 'uppercase tracking-[0.14em]' : '',
        tones[tone],
      ].join(' ')}
    >
      {children}
    </span>
  );
}
