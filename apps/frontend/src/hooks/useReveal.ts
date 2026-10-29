import { useEffect, useRef, useState } from 'react';

/**
 * Reveal-on-scroll: returns a ref to attach to an element and a boolean that
 * flips to true once the element scrolls into view. Pairs with the `.reveal` /
 * `.is-visible` CSS utilities for the "books fade in as you scroll" effect.
 *
 * Respects reduced-motion by resolving to visible immediately, and degrades to
 * always-visible if IntersectionObserver is unavailable.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}) {
  const { threshold = 0.15, rootMargin = '0px 0px -10% 0px', once = true } = options ?? {};
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, visible };
}
