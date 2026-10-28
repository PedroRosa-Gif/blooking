import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'rainbow' | 'ghost' | 'ink';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

/**
 * Button primitives from the design system:
 *  - `rainbow`: the single rainbow-outlined pill CTA (sign up / primary action).
 *  - `ghost`:   text-only secondary action (login, inline links).
 *  - `ink`:     a quiet solid-ink pill for in-page actions (search, submit).
 *
 * Per the design rules there are NO filled colored buttons; the rainbow is a
 * 1.5px border only, and body/label text never uses the gradient fill.
 */
const base =
  'inline-flex items-center justify-center gap-[var(--spacing-8)] rounded-[var(--radius-buttons)] ' +
  'font-medium transition-[transform,opacity,background-color] duration-150 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px';

const variants: Record<Variant, string> = {
  rainbow:
    'border-rainbow bg-[var(--color-white-canvas)] text-[var(--color-portrait-ink)] ' +
    'px-[var(--spacing-20)] py-[var(--spacing-12)] text-[var(--text-body)] hover:bg-[var(--color-sky-wash)]',
  ghost:
    'bg-transparent text-[var(--color-portrait-ink)] px-[var(--spacing-12)] py-[var(--spacing-8)] ' +
    'text-[var(--text-body)] hover:text-[var(--color-nautical-teal)]',
  ink:
    'bg-[var(--color-portrait-ink)] text-[var(--color-white-canvas)] ' +
    'px-[var(--spacing-24)] py-[var(--spacing-12)] text-[var(--text-body)] hover:opacity-90',
};

export function Button({ variant = 'ink', className = '', children, ...rest }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
