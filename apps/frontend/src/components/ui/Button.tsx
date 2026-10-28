import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'accent' | 'outline' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

/**
 * Button primitives (pill shaped, per design_v2).
 *  - `accent`:  the single amber filled CTA (sign up / primary conversion).
 *  - `outline`: amber-outlined secondary action, stays visible on the sky.
 *  - `ghost`:   text-only tertiary action (login, inline links).
 *
 * The amber accent replaces the old rainbow entirely — it's the one chromatic
 * action color in the system.
 */
const base =
  'inline-flex items-center justify-center gap-[var(--spacing-8)] rounded-[var(--radius-buttons)] ' +
  'font-medium transition-[background-color,color,box-shadow,transform] duration-150 ' +
  'disabled:cursor-not-allowed disabled:opacity-45 active:translate-y-px';

const variants: Record<Variant, string> = {
  accent:
    'bg-[var(--accent)] text-[var(--accent-ink)] px-[var(--spacing-24)] py-[var(--spacing-12)] ' +
    'text-[var(--text-body)] hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-accent-glow)]',
  outline:
    'bg-transparent text-[var(--accent)] border border-[var(--accent)] ' +
    'px-[var(--spacing-24)] py-[var(--spacing-12)] text-[var(--text-body)] hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]',
  ghost:
    'bg-transparent text-[var(--text)] px-[var(--spacing-16)] py-[var(--spacing-8)] ' +
    'text-[var(--text-body)] hover:text-[var(--accent)]',
};

export function Button({ variant = 'accent', className = '', children, ...rest }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
