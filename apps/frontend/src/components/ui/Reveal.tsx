import type { ElementType, ReactNode } from 'react';
import { useReveal } from '@/hooks/useReveal';

/**
 * Wraps children in a scroll-reveal (fade + rise). Used to give every section
 * the "emerge as you scroll" cadence from design_v2.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
}
