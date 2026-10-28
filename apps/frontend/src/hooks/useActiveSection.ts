import { useEffect, useState } from 'react';

/**
 * Pick which section is "current" given each section's distance from the top of
 * the viewport. The current one is the LAST section whose top has scrolled past
 * `offset` (the sticky header height plus some breathing room); before any
 * section reaches that line, the first one is current.
 *
 * Pure so it can be tested without a DOM.
 */
export function pickActive(
  tops: Array<{ id: string; top: number }>,
  offset: number,
): string | null {
  if (tops.length === 0) return null;
  let active = tops[0].id;
  for (const s of tops) {
    if (s.top - offset <= 0) active = s.id;
  }
  return active;
}

/**
 * Scroll-spy: returns the id of the section currently being read.
 * `ids` should be in page order. Missing elements are skipped.
 */
export function useActiveSection(ids: string[], offset = 120): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const key = ids.join('|');

  useEffect(() => {
    const list = key ? key.split('|') : [];
    if (list.length === 0) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const tops = list
        .map((id) => {
          const el = document.getElementById(id);
          return el ? { id, top: el.getBoundingClientRect().top } : null;
        })
        .filter((x): x is { id: string; top: number } => x !== null);

      // At the very bottom of the page the last section may never reach the line.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      setActive(atBottom && tops.length > 0 ? tops[tops.length - 1].id : pickActive(tops, offset));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [key, offset]);

  return active;
}
