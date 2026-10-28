import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'solid' | 'glass';

const variants: Record<Variant, string> = {
  // Tonal tile with a hairline and a faint top highlight (no drop shadow).
  solid: 'bg-card border border-line shadow-card',
  // Translucent tile for use directly over the sky.
  glass: 'bg-card/60 border border-line shadow-card backdrop-blur-xl',
};

export function Card({
  variant = 'solid',
  className,
  children,
}: {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn('rounded-card p-6', variants[variant], className)}>{children}</div>;
}
