import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/AuthContext';
import { addId, removeId } from '@/lib/favoriteSet';
import type { BookSummary, Page } from '@/types/api';
import { addFavorite, getFavoriteIds, getFavoritesPage, removeFavorite } from './favorites';
import { queryKeys } from './queryKeys';

const PAGE_SIZE = 24;

/**
 * The set of favorited book IDs (as an array), loaded once per session and kept
 * in cache so heart toggles everywhere can render without per-book requests.
 * Disabled when logged out.
 */
export function useFavoriteIds() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: queryKeys.favorites.ids,
    queryFn: () => getFavoriteIds(),
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });
}

/**
 * Toggle a favorite with an optimistic update of the ID set, rolling back on
 * error. Because the backend endpoints are idempotent, a double click or a
 * stale view can't corrupt state. Also invalidates the favorites list and
 * recommendations (which depend on favorites) on success.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookId, favorited }: { bookId: number; favorited: boolean }) =>
      favorited ? removeFavorite(bookId) : addFavorite(bookId),

    onMutate: async ({ bookId, favorited }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.ids });
      const previous = queryClient.getQueryData<number[]>(queryKeys.favorites.ids);
      queryClient.setQueryData<number[]>(queryKeys.favorites.ids, (ids = []) =>
        favorited ? removeId(ids, bookId) : addId(ids, bookId),
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.favorites.ids, context.previous);
      }
    },

    onSuccess: () => {
      // The favorites list and recommendations are derived from favorites.
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
}

/** Infinite list of the user's favorite books (US11). */
export function useInfiniteFavorites() {
  const { isAuthenticated } = useAuth();
  return useInfiniteQuery({
    queryKey: queryKeys.favorites.list,
    queryFn: ({ pageParam }) => getFavoritesPage(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage: Page<BookSummary>) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: isAuthenticated,
  });
}
