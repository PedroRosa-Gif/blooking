import { useMemo } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { useBooksByAuthor, useGenreShelf } from '@/api/hooks';
import { primaryAuthor, samePrimaryAuthor } from '@/lib/authors';
import { pickRelatedGenre } from '@/lib/genres';
import type { BookDetail, BookSummary } from '@/types/api';
import { BookShelf } from '@/components/ui/BookShelf';

const MIN_BOOKS = 2;

/**
 * Books by the same author. The backend filter is a substring match, so results
 * are narrowed to the same primary author and the current book is removed.
 * Shared by the shelf and the page's section nav (same query key, one request).
 */
export function useMoreByAuthor(book: BookDetail): BookSummary[] {
  const { data } = useBooksByAuthor(primaryAuthor(book.author));
  return useMemo(
    () => (data ?? []).filter((b) => b.id !== book.id && samePrimaryAuthor(b.author, book.author)),
    [data, book.id, book.author],
  );
}

/** Books in the book's most specific genre, excluding the book itself. */
export function useMoreInGenre(book: BookDetail): { genre: string | null; books: BookSummary[] } {
  const genre = pickRelatedGenre(book.genres);
  const { data } = useGenreShelf(genre ?? '', 18, Boolean(genre));
  const books = useMemo(() => (data ?? []).filter((b) => b.id !== book.id), [data, book.id]);
  return { genre, books };
}

export const hasEnough = (books: BookSummary[]) => books.length >= MIN_BOOKS;

export function MoreByAuthor({ book }: { book: BookDetail }) {
  const { t } = useI18n();
  const books = useMoreByAuthor(book);
  if (!hasEnough(books)) return null;
  return (
    <BookShelf
      id="more-author"
      title={t('detail.moreBy', { author: primaryAuthor(book.author) })}
      subtitle={t('detail.moreBy.sub')}
      books={books}
    />
  );
}

export function MoreInGenre({ book }: { book: BookDetail }) {
  const { t } = useI18n();
  const { genre, books } = useMoreInGenre(book);
  if (!genre || !hasEnough(books)) return null;
  return (
    <BookShelf
      id="more-genre"
      title={t('detail.moreIn', { genre })}
      subtitle={t('detail.moreIn.sub')}
      books={books}
    />
  );
}
