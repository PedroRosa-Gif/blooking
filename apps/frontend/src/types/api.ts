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

/** Spring Data "sort" descriptor as serialized in the legacy Page JSON. */
export interface SpringSort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

/** Spring Data "pageable" descriptor as serialized in the legacy Page JSON. */
export interface SpringPageable {
  pageNumber: number;
  pageSize: number;
  sort: SpringSort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

/**
 * Legacy Spring `Page<T>` JSON envelope.
 *
 * Returned directly (not wrapped) by `GET /api/books` and `GET /api/favorites`.
 * `number` is the 0-based current page index.
 */
export interface Page<T> {
  content: T[];
  pageable: SpringPageable;
  last: boolean;
  totalElements: number;
  totalPages: number;
  first: boolean;
  size: number;
  number: number;
  sort: SpringSort;
  numberOfElements: number;
  empty: boolean;
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

export interface RefreshRequest {
  refreshToken: string;
}

/** Returned by register / login / refresh. `tokenType` is always "Bearer". */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
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
