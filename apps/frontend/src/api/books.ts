import { api } from '@/lib/axios';
import { normalizePage } from '@/lib/page';
import type { BookDetail, BookSummary, Page, RawPage } from '@/types/api';

/** Filters for the catalog. `genres` is an array in the UI; see note below. */
export interface BookFilters {
  q?: string;
  author?: string;
  /**
   * Selected genres. The UI supports multiple, but the backend currently
   * accepts a single `genre` param, so only the FIRST is sent (see
   * {@link toBookParams}).
   *
   * TODO(backend): make GET /api/books accept multiple genres (repeated param
   * or comma-separated) and match ANY of them; then send the whole array here.
   * Tracked as a project learning.
   */
  genres?: string[];
  /** Spring sort expression, e.g. "rating,desc". */
  sort?: string;
}

export interface BookListParams extends BookFilters {
  page?: number; // 0-based
  size?: number;
}

/** Backend query params for `/api/books` — the wire shape (single `genre`). */
export interface BookQueryParams {
  q?: string;
  author?: string;
  genre?: string;
  sort?: string;
  page?: number;
  size?: number;
}

/** Map UI filters to backend params. Blank strings are dropped. */
export function toBookParams(params: BookListParams): BookQueryParams {
  const out: BookQueryParams = {};
  if (params.q?.trim()) out.q = params.q.trim();
  if (params.author?.trim()) out.author = params.author.trim();
  // Only the first genre is sent until the backend supports multiple.
  const firstGenre = params.genres?.[0]?.trim();
  if (firstGenre) out.genre = firstGenre;
  if (params.sort) out.sort = params.sort;
  if (params.page != null) out.page = params.page;
  if (params.size != null) out.size = params.size;
  return out;
}

/** `GET /api/books` — paginated catalog with optional filters. */
export async function getBooks(params: BookListParams = {}): Promise<Page<BookSummary>> {
  const { data } = await api.get<RawPage<BookSummary>>('/api/books', {
    params: toBookParams(params),
  });
  return normalizePage(data);
}

/** `GET /api/books/{id}` — full detail (also fires a backend "viewed" event). */
export async function getBook(id: number): Promise<BookDetail> {
  const { data } = await api.get<BookDetail>(`/api/books/${id}`);
  return data;
}

/** `GET /api/search?q=&limit=` — hybrid search, returns a bare array. */
export async function searchBooks(q: string, limit = 24): Promise<BookSummary[]> {
  const { data } = await api.get<BookSummary[]>('/api/search', {
    params: { q, limit },
  });
  return data;
}
