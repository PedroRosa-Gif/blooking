import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * On navigation to a new path, scroll to the top. Hash links (in-page anchors)
 * are left to the browser. Honors reduced-motion by jumping instantly.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'auto' });
  }, [pathname, hash]);

  return null;
}
