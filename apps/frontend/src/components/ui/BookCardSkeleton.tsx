import { cn } from '@/lib/cn';

/** Placeholder matching BookCard's footprint while covers load. */
export function BookCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('w-full', className)} aria-hidden="true">
      <div className="aspect-[2/3] animate-pulse rounded-image bg-card-2 ring-1 ring-line" />
      <div className="mt-3 space-y-2">
        <div className="h-3.5 w-11/12 animate-pulse rounded bg-card-2" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-card-2" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-card-2" />
      </div>
    </div>
  );
}

/** A grid of skeletons for first-load states. */
export function BookGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
}
