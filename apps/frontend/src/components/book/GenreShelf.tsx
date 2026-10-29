import { useGenreShelf } from '@/api/hooks';
import { BookShelf } from '@/components/ui/BookShelf';
import { BookCardSkeleton } from '@/components/ui/BookCardSkeleton';

/**
 * One Home shelf backed by `GET /api/books?genre=`. Shows a skeleton row while
 * loading and renders nothing if the genre has no books or the request fails,
 * so a single bad shelf never blocks the page.
 */
export function GenreShelf({
  domId,
  genre,
  title,
  subtitle,
}: {
  domId: string;
  genre: string;
  title: string;
  subtitle: string;
}) {
  const { data, isLoading, isError } = useGenreShelf(genre);

  if (isLoading) {
    return (
      <div>
        <div className="mb-6 h-7 w-40 animate-pulse rounded bg-card-2" />
        <div className="-mx-6 flex gap-5 overflow-hidden px-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <BookCardSkeleton key={i} className="w-40 shrink-0 sm:w-44" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data || data.length === 0) return null;

  return <BookShelf id={domId} title={title} subtitle={subtitle} books={data} />;
}
