import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_GENRE_MATCH, type BookFilters, type GenreMatch } from '@/api/books';
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
  genreMatch: GenreMatch;
  sort: string;
}

export function useCatalogParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo<CatalogState>(
    () => ({
      author: searchParams.get('author') ?? '',
      genres: searchParams.getAll('genre'),
      genreMatch: searchParams.get('genreMatch') === 'any' ? 'any' : DEFAULT_GENRE_MATCH,
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
          if ('genreMatch' in patch) {
            // Only persist the non-default mode to keep URLs clean.
            if (patch.genreMatch === 'any') next.set('genreMatch', 'any');
            else next.delete('genreMatch');
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
      const genres = [...set];
      // The match mode only matters with 2+ genres; reset it once it no longer
      // applies so a stale `genreMatch=any` doesn't linger in the URL.
      const patch: Partial<CatalogState> = { genres };
      if (genres.length < 2 && state.genreMatch !== DEFAULT_GENRE_MATCH) {
        patch.genreMatch = DEFAULT_GENRE_MATCH;
      }
      update(patch);
    },
    [state.genres, state.genreMatch, update],
  );

  const clear = useCallback(() => setSearchParams({}, { replace: true }), [setSearchParams]);

  const hasFilters = state.author !== '' || state.genres.length > 0 || state.sort !== DEFAULT_SORT;

  return { state, update, toggleGenre, clear, hasFilters };
}
