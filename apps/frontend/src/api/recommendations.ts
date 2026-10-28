import { api } from '@/lib/axios';
import type { BookSummary } from '@/types/api';

/** `GET /api/recommendations?limit=` — personalized list (auth). Never empty. */
export async function getRecommendations(limit = 12): Promise<BookSummary[]> {
  const { data } = await api.get<BookSummary[]>('/api/recommendations', { params: { limit } });
  return data;
}
