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

/** Hybrid search (US01). Disabled until there is a non-empty query. */
export function useSearch(q: string, limit = 24) {
  const query = q.trim();
  return useQuery({
    queryKey: queryKeys.search(query, limit),
    queryFn: () => searchBooks(query, limit),
    enabled: query.length > 0,
    placeholderData: (prev) => prev,
  });
}
