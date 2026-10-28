import type { BookFilters } from './books';

/** Centralized React Query key factory. */
export const queryKeys = {
  books: {
    all: ['books'] as const,
    infinite: (filters: BookFilters) => ['books', 'infinite', filters] as const,
    byGenre: (genre: string, size: number) => ['books', 'genre', genre, size] as const,
    byAuthor: (author: string, size: number) => ['books', 'author', author, size] as const,
    detail: (id: number) => ['books', 'detail', id] as const,
  },
  search: (q: string, limit: number) => ['search', q, limit] as const,
  favorites: (page: number, size: number) => ['favorites', page, size] as const,
  recommendations: (limit: number) => ['recommendations', limit] as const,
  me: ['auth', 'me'] as const,
};
