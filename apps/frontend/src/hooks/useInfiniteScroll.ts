import { useCallback, useEffect, useRef } from 'react';

/**
 * Infinite scroll via a sentinel element placed after the last item.
 *
 * Returns a callback ref to attach to the sentinel. It calls `onReachEnd` when
 * the sentinel is within `marginPx` below the viewport, and keeps loading after
 * each page for as long as it stays in range (so a tall screen fills up
 * without the user scrolling first), but never more than needed.
 *
 * Details that matter:
 *  - A callback ref (not useRef) so the observer attaches the moment the
 *    sentinel mounts, even if it only renders after the first page arrives.
 *  - The latest `onReachEnd` / flags live in refs, so the observer is created
 *    once per sentinel instead of being torn down on every render.
 *  - The decision is made by MEASURING the sentinel at that moment, not by
 *    trusting the last observer notification. The observer reports changes
 *    asynchronously, so right after a page renders its last value is stale and
 *    would trigger one page too many.
 */
export function useInfiniteScroll({
  onReachEnd,
  canLoadMore,
  isLoading,
  marginPx = 500,
}: {
  onReachEnd: () => void;
  canLoadMore: boolean;
  isLoading: boolean;
  marginPx?: number;
}) {
  const latest = useRef({ onReachEnd, canLoadMore, isLoading });
  latest.current = { onReachEnd, canLoadMore, isLoading };

  const nodeRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const maybeLoad = useCallback(() => {
    const node = nodeRef.current;
    const { onReachEnd: load, canLoadMore: more, isLoading: busy } = latest.current;
    if (!node || !more || busy) return;
    const inRange = node.getBoundingClientRect().top <= window.innerHeight + marginPx;
    if (inRange) load();
  }, [marginPx]);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      nodeRef.current = node;
      if (!node || typeof IntersectionObserver === 'undefined') return;

      const observer = new IntersectionObserver(() => maybeLoad(), {
        rootMargin: `${marginPx}px 0px`,
      });
      observer.observe(node);
      observerRef.current = observer;
    },
    [maybeLoad, marginPx],
  );

  // After a page finishes loading (or more become available) the sentinel may
  // still be in range, and the observer will not report that. Re-measure once
  // the browser has laid out the new content (two frames); measuring in the
  // same tick would read the position from before the new items existed.
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(maybeLoad);
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [canLoadMore, isLoading, maybeLoad]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return ref;
}
