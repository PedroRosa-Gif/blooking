import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Pill buttons (design_v3). Heights are fixed per size so every control in the
 * header, hero and footer lines up: sm 36px, md 40px, lg 48px.
 *  - primary: amber fill, the single filled action
 *  - outline: hairline border, defers to the primary
 *  - ghost:   text only
 */
const base =
  'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full ' +
  'font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink shadow-sm hover:bg-accent-hover',
  outline: 'border border-line-strong text-fg hover:bg-fg/5',
  ghost: 'text-fg-muted hover:text-fg',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-body-sm',
  md: 'h-10 px-5 text-body-sm',
  lg: 'h-12 px-7 text-body',
};

/** Class string, so links (<a>, <Link>) can look exactly like buttons. */
export function buttonClasses(opts: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const { variant = 'primary', size = 'md', className } = opts;
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({ variant, size, className, children, ...rest }: ButtonProps) {
  return (
    <button className={buttonClasses({ variant, size, className })} {...rest}>
      {children}
    </button>
  );
}
