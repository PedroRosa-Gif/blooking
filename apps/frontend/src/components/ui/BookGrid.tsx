import type { BookSummary } from '@/types/api';
import { BookCard } from './BookCard';

/** Responsive poster grid used by the catalog and search results. */
export function BookGrid({ books }: { books: BookSummary[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
