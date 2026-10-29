import { api } from '@/lib/axios';
import { normalizePage } from '@/lib/page';
import type { BookDetail, BookSummary, Page, RawPage } from '@/types/api';

/** How to combine multiple selected genres. Mirrors the backend `genreMatch`. */
export type GenreMatch = 'all' | 'any';

/** The default: a book must have every selected genre. */
export const DEFAULT_GENRE_MATCH: GenreMatch = 'all';

/** Filters for the catalog. */
export interface BookFilters {
  q?: string;
  author?: string;
  /** Selected genres. All are sent to the backend as repeated `genre` params. */
  genres?: string[];
  /**
   * How to combine {@link genres}: `all` (default) requires every genre, `any`
   * requires at least one. Only meaningful when 2+ genres are selected.
   */
  genreMatch?: GenreMatch;
  /** Spring sort expression, e.g. "rating,desc". */
  sort?: string;
}

export interface BookListParams extends BookFilters {
  page?: number; // 0-based
  size?: number;
}

/**
 * Backend query params for `/api/books` — the wire shape. `genre` is a repeated
 * param (array), matched according to `genreMatch` (`all` | `any`).
 */
export interface BookQueryParams {
  q?: string;
  author?: string;
  genre?: string[];
  genreMatch?: GenreMatch;
  sort?: string;
  page?: number;
  size?: number;
}

/** Map UI filters to backend params. Blank strings are dropped. */
export function toBookParams(params: BookListParams): BookQueryParams {
  const out: BookQueryParams = {};
  if (params.q?.trim()) out.q = params.q.trim();
  if (params.author?.trim()) out.author = params.author.trim();
  const genres = params.genres?.map((g) => g.trim()).filter(Boolean) ?? [];
  if (genres.length > 0) {
    out.genre = genres;
    // Only disambiguate when it actually matters (2+ genres) and the mode is
    // non-default, keeping the query string clean for the common case.
    if (genres.length > 1 && params.genreMatch && params.genreMatch !== DEFAULT_GENRE_MATCH) {
      out.genreMatch = params.genreMatch;
    }
  }
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
