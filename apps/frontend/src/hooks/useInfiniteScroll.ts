import { useEffect, useRef } from 'react';

/**
 * Calls `onReachEnd` when a sentinel element scrolls into view. Attach the
 * returned ref to a node placed after the last item. Guards against firing
 * while a fetch is in flight or when there is nothing more to load.
 */
export function useInfiniteScroll({
  onReachEnd,
  canLoadMore,
  isLoading,
  rootMargin = '600px 0px',
}: {
  onReachEnd: () => void;
  canLoadMore: boolean;
  isLoading: boolean;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !canLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoading) {
          onReachEnd();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onReachEnd, canLoadMore, isLoading, rootMargin]);

  return ref;
}
