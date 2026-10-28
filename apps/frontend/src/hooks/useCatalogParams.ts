import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BookFilters } from '@/api/books';
import { DEFAULT_SORT } from '@/lib/genres';

/**
 * Reads/writes the catalog filters from the URL query string, so the catalog is
 * shareable and survives back/forward. Genres are a repeated `genre` param.
 */
export interface CatalogState extends BookFilters {
  q: string;
  author: string;
  genres: string[];
  sort: string;
}

export function useCatalogParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo<CatalogState>(
    () => ({
      q: searchParams.get('q') ?? '',
      author: searchParams.get('author') ?? '',
      genres: searchParams.getAll('genre'),
      sort: searchParams.get('sort') ?? DEFAULT_SORT,
    }),
    [searchParams],
  );

  const update = useCallback(
    (patch: Partial<CatalogState>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const apply = (key: string, value?: string) => {
            if (value && value.trim()) next.set(key, value.trim());
            else next.delete(key);
          };
          if ('q' in patch) apply('q', patch.q);
          if ('author' in patch) apply('author', patch.author);
          if ('sort' in patch) {
            if (patch.sort && patch.sort !== DEFAULT_SORT) next.set('sort', patch.sort);
            else next.delete('sort');
          }
          if ('genres' in patch) {
            next.delete('genre');
            for (const g of patch.genres ?? []) next.append('genre', g);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const toggleGenre = useCallback(
    (genre: string) => {
      const set = new Set(state.genres);
      if (set.has(genre)) set.delete(genre);
      else set.add(genre);
      update({ genres: [...set] });
    },
    [state.genres, update],
  );

  const clear = useCallback(() => setSearchParams({}, { replace: true }), [setSearchParams]);

  const hasFilters =
    state.q !== '' || state.author !== '' || state.genres.length > 0 || state.sort !== DEFAULT_SORT;

  return { state, update, toggleGenre, clear, hasFilters };
}
