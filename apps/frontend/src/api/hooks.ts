import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { BookSummary, Page } from '@/types/api';
import { getBook, getBooks, searchBooks, type BookFilters } from './books';
import { queryKeys } from './queryKeys';

const PAGE_SIZE = 24;

/**
 * Infinite catalog list (US02/US03). Returns Spring `Page` pages; the next page
 * index comes from the page envelope (`last` / `number`).
 */
export function useInfiniteBooks(filters: BookFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.books.infinite(filters),
    queryFn: ({ pageParam }) => getBooks({ ...filters, page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: Page<BookSummary>) =>
      lastPage.last ? undefined : lastPage.number + 1,
    // Catalog data is seeded and static: keep it fresh for a while so coming
    // back from a book does not refetch every page that was already loaded.
    staleTime: 10 * 60_000,
    placeholderData: (prev) => prev, // keep showing results while filters change
  });
}

/** One genre shelf for the Home page (first page only). */
export function useGenreShelf(genre: string, size = 16, enabled = true) {
  return useQuery({
    queryKey: queryKeys.books.byGenre(genre, size),
    queryFn: () => getBooks({ genres: [genre], size, sort: 'num_ratings,desc' }),
    enabled,
    select: (page) => page.content,
  });
}

/** Book detail (US04). */
export function useBook(id: number) {
  return useQuery({
    queryKey: queryKeys.books.detail(id),
    queryFn: () => getBook(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

/**
 * Hybrid search (US01). Disabled until there is a non-empty query.
 *
 * Every search request makes the backend compute an embedding and record a
 * `searched` interaction, so results are cached for a while: going back to a
 * search or re-visiting it within 10 minutes costs nothing.
 */
export function useSearch(q: string, limit = 24) {
  const query = q.trim();
  return useQuery({
    queryKey: queryKeys.search(query, limit),
    queryFn: () => searchBooks(query, limit),
    enabled: query.length > 0,
    staleTime: 10 * 60_000,
    placeholderData: (prev) => prev,
  });
}

/**
 * The decorative search preview on the Home page. It is not something a user
 * asked for, so it must not count as a search: it runs at most once per page
 * load (never refetches) instead of once per Home visit.
 */
export function useSearchPreview(q: string, limit = 3) {
  const query = q.trim();
  return useQuery({
    queryKey: [...queryKeys.search(query, limit), 'preview'],
    queryFn: () => searchBooks(query, limit),
    enabled: query.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/**
 * Other books by the same author ("More by ..."). The backend filter is a
 * substring match, so the caller must still drop other people and the current
 * book (see lib/authors.samePrimaryAuthor).
 */
export function useBooksByAuthor(author: string, size = 16) {
  const name = author.trim();
  return useQuery({
    queryKey: queryKeys.books.byAuthor(name, size),
    queryFn: () => getBooks({ author: name, size, sort: 'num_ratings,desc' }),
    enabled: name.length > 0,
    staleTime: 10 * 60_000,
    select: (page) => page.content,
  });
}
