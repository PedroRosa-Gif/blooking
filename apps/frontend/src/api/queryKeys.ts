import type { BookListParams } from './books';

/** Centralized React Query key factory to keep cache keys consistent. */
export const queryKeys = {
  books: {
    all: ['books'] as const,
    list: (params: BookListParams) => ['books', 'list', params] as const,
    detail: (id: number) => ['books', 'detail', id] as const,
  },
  search: (q: string, limit: number) => ['search', q, limit] as const,
  favorites: (page: number, size: number) => ['favorites', page, size] as const,
  recommendations: (limit: number) => ['recommendations', limit] as const,
  me: ['auth', 'me'] as const,
};
