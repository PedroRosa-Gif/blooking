import { api } from '@/lib/axios';
import type { BookSummary, FavoriteRecommendation } from '@/types/api';

/** `GET /api/recommendations?limit=` — personalized list (auth). Never empty. */
export async function getRecommendations(limit = 12): Promise<BookSummary[]> {
  const { data } = await api.get<BookSummary[]>('/api/recommendations', { params: { limit } });
  return data;
}

/**
 * `GET /api/recommendations/by-favorites` — "because you liked X" carousels, one
 * per recent favorite (auth). Returns an empty array when the user has no
 * favorites with usable embeddings; the count and size are fixed server-side.
 */
export async function getFavoriteRecommendations(): Promise<FavoriteRecommendation[]> {
  const { data } = await api.get<FavoriteRecommendation[]>('/api/recommendations/by-favorites');
  return data;
}
