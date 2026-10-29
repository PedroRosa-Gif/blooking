import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'accent' | 'neutral';

const tones: Record<Tone, string> = {
  accent: 'border-accent/30 bg-accent/10 text-accent',
  neutral: 'border-line bg-fg/5 text-fg-muted',
};

/** Small mono label for eyebrows, counts and status ("Soon"). */
export function Tag({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-1 font-mono text-caption uppercase leading-none tracking-wider',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
