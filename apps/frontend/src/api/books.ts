import { api } from '@/lib/axios';
import type { BookDetail, BookSummary, Page } from '@/types/api';

export interface BookListParams {
  /** Free-text filter. */
  q?: string;
  author?: string;
  genre?: string;
  /** 0-based page index. */
  page?: number;
  /** Page size (backend caps at 100). */
  size?: number;
  /** Spring sort expression, e.g. "rating,desc". */
  sort?: string;
}

/** `GET /api/books` — paginated catalog with optional filters. */
export async function getBooks(params: BookListParams = {}): Promise<Page<BookSummary>> {
  const { data } = await api.get<Page<BookSummary>>('/api/books', { params });
  return data;
}

/** `GET /api/books/{id}` — full detail (also fires a backend "viewed" event). */
export async function getBook(id: number): Promise<BookDetail> {
  const { data } = await api.get<BookDetail>(`/api/books/${id}`);
  return data;
}

/** `GET /api/search?q=&limit=` — hybrid search, returns a bare array. */
export async function searchBooks(q: string, limit = 20): Promise<BookSummary[]> {
  const { data } = await api.get<BookSummary[]>('/api/search', { params: { q, limit } });
  return data;
}
