import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BookFilters } from '@/api/books';
import { DEFAULT_SORT } from '@/lib/genres';

/**
 * Catalog filters, kept in the URL so the catalog is shareable and survives
 * back/forward. Genres are a repeated `genre` param.
 *
 * There is deliberately no free-text field here: searching by words is the job
 * of the Search page (hybrid semantic + keyword). The catalog is for browsing
 * with structured filters (genre, author, sort).
 */
export interface CatalogState extends BookFilters {
  author: string;
  genres: string[];
  sort: string;
}

export function useCatalogParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo<CatalogState>(
    () => ({
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
          if ('author' in patch) {
            const v = patch.author?.trim();
            if (v) next.set('author', v);
            else next.delete('author');
          }
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

  const hasFilters = state.author !== '' || state.genres.length > 0 || state.sort !== DEFAULT_SORT;

  return { state, update, toggleGenre, clear, hasFilters };
}
