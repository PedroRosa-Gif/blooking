import type { ReactNode } from 'react';

type Variant = 'surface' | 'glass';

const variants: Record<Variant, string> = {
  // Quiet content card on a solid surface band (design_v1 "Photo Profile Card").
  surface: 'bg-[var(--surface)] border border-[var(--hairline)] shadow-[var(--shadow-card)]',
  // Floating card over the sky — translucent + blur (design_v2 floating panels).
  glass:
    'bg-[color-mix(in_srgb,var(--surface)_72%,transparent)] border border-[var(--hairline)] ' +
    'shadow-[var(--shadow-float)] backdrop-blur-md',
};

export function Card({
  variant = 'surface',
  className = '',
  children,
}: {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-[var(--radius-cards)] p-[var(--spacing-24)] ${variants[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
