import { api } from '@/lib/axios';
import { normalizePage } from '@/lib/page';
import type { BookSummary, Page, RawPage } from '@/types/api';

/** `POST /api/favorites/{bookId}` — idempotent; 201 even if already favorited. */
export async function addFavorite(bookId: number): Promise<void> {
  await api.post(`/api/favorites/${bookId}`);
}

/** `DELETE /api/favorites/{bookId}` — idempotent; 204 even if not favorited. */
export async function removeFavorite(bookId: number): Promise<void> {
  await api.delete(`/api/favorites/${bookId}`);
}

/** `GET /api/favorites` — one page of the user's favorites (newest first). */
export async function getFavoritesPage(page = 0, size = 24): Promise<Page<BookSummary>> {
  const { data } = await api.get<RawPage<BookSummary | null>>('/api/favorites', {
    params: { page, size },
  });
  const normalized = normalizePage(data);
  // A favorited book whose row no longer exists comes back as null — drop it.
  return { ...normalized, content: normalized.content.filter((b): b is BookSummary => b != null) };
}

/**
 * All favorited book IDs, for painting heart toggles across the app. The
 * backend has no dedicated "ids" endpoint, so we page through /api/favorites
 * and collect ids. Capped so a user with thousands of favorites can't trigger
 * an unbounded walk (the toggles for the rest just start unfilled).
 *
 * TODO(backend): a GET /api/favorites/ids endpoint (or an `isFavorited` flag on
 * book responses) would replace this. Tracked as a project learning.
 */
export async function getFavoriteIds(maxPages = 25, size = 100): Promise<number[]> {
  const ids: number[] = [];
  for (let page = 0; page < maxPages; page++) {
    const { data } = await api.get<RawPage<BookSummary | null>>('/api/favorites', {
      params: { page, size },
    });
    const normalized = normalizePage(data);
    for (const book of normalized.content) if (book) ids.push(book.id);
    if (normalized.last) break;
  }
  return ids;
}
