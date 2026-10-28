import { useQuery } from '@tanstack/react-query';
import { getBook, getBooks, searchBooks, type BookListParams } from './books';
import { queryKeys } from './queryKeys';

export function useBooks(params: BookListParams = {}) {
  return useQuery({
    queryKey: queryKeys.books.list(params),
    queryFn: () => getBooks(params),
  });
}

export function useBook(id: number) {
  return useQuery({
    queryKey: queryKeys.books.detail(id),
    queryFn: () => getBook(id),
    enabled: Number.isFinite(id),
  });
}

export function useSearch(q: string, limit = 20) {
  return useQuery({
    queryKey: queryKeys.search(q, limit),
    queryFn: () => searchBooks(q, limit),
    enabled: q.trim().length > 0,
  });
}
