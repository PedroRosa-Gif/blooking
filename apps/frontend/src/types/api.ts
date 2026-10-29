/**
 * TypeScript mirror of the Blooking backend REST contract.
 *
 * These types are hand-written to match the Spring Boot DTOs byte-for-byte
 * (field names and nullability verified against the backend source). Keep them
 * in sync when the backend contract changes.
 */

/* ------------------------------------------------------------------ *
 * Pagination
 * ------------------------------------------------------------------ */

/**
 * Page envelope as the backend sends it. The backend sets
 * `spring.data.web.pageable.serialization-mode: via_dto`, so it sends the
 * `page` object below. The older flat shape (`number`, `totalElements`, `last`
 * at the top level) is accepted too, so a config change cannot break paging.
 * Never read these fields directly: go through `normalizePage` (lib/page.ts).
 */
export interface RawPage<T> {
  content: T[];
  /** via_dto shape */
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
  /** legacy shape */
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  last?: boolean;
}

/** The one page shape the app uses. `number` is the 0-based page index. */
export interface Page<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  /** True when there is no page after this one. */
  last: boolean;
}

/* ------------------------------------------------------------------ *
 * Books
 * ------------------------------------------------------------------ */

/**
 * Book summary — the list/card shape. Used by `/api/books` (page content),
 * `/api/search` (bare array) and `/api/recommendations` (bare array), and
 * `/api/favorites` (page content).
 */
export interface BookSummary {
  id: number;
  title: string;
  author: string;
  series: string | null;
  /** Never null — empty array when the book has no genres. */
  genres: string[];
  rating: number | null;
  numRatings: number | null;
  publishYear: number | null;
  coverImg: string | null;
}

/**
 * One "because you liked X" carousel — an item of
 * `GET /api/recommendations/by-favorites`. `source` is a book the user
 * favorited; `similar` are the books most similar to it (ranked), never
 * including the source or any of the user's favorites.
 */
export interface FavoriteRecommendation {
  source: BookSummary;
  similar: BookSummary[];
}

/** Full book detail — `GET /api/books/{id}`. */
export interface BookDetail {
  id: number;
  title: string;
  series: string | null;
  author: string | null;
  description: string | null;
  language: string | null;
  isbn: string | null;
  /** Never null — empty array fallback. */
  genres: string[];
  /** Never null — empty array fallback. */
  characters: string[];
  /** Never null — empty array fallback. */
  awards: string[];
  bookFormat: string | null;
  pages: number | null;
  publisher: string | null;
  publishYear: number | null;
  rating: number | null;
  numRatings: number | null;
  likedPercent: number | null;
  coverImg: string | null;
  price: number | null;
}

/* ------------------------------------------------------------------ *
 * Auth
 * ------------------------------------------------------------------ */

export interface RegisterRequest {
  /** 3–50 chars. */
  username: string;
  /** 8–100 chars. */
  password: string;
  /** Optional, max 100 chars. */
  displayName?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Returned by register / login / refresh. `tokenType` is always "Bearer".
 *
 * The refresh token is NOT here — the backend delivers it as an `HttpOnly`
 * cookie (invisible to JS), sent automatically on auth requests because the
 * axios client uses `withCredentials`.
 */
export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

/** `GET /api/auth/me`. Never includes the password hash. */
export interface User {
  id: number;
  username: string;
  displayName: string | null;
  /** Enum name, e.g. "USER" / "ADMIN". */
  role: string;
}

/* ------------------------------------------------------------------ *
 * Errors
 * ------------------------------------------------------------------ */

/**
 * The custom error body produced by GlobalExceptionHandler.
 * NOTE: the security layer returns 401 with an EMPTY body, and a few Spring
 * defaults use a different shape — callers must tolerate a missing `message`.
 */
export interface ApiErrorBody {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  /** Present only in Spring's default error body (not the custom handler). */
  path?: string;
}
