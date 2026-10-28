import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import { FILTER_GENRES, SORT_OPTIONS } from '@/lib/genres';
import type { CatalogState } from '@/hooks/useCatalogParams';
import { SearchIcon, CloseIcon } from '@/components/ui/Icon';

/**
 * Catalog filters: free-text + author inputs (debounced into the URL), a row of
 * multi-select genre chips, a sort <select>, and a clear-all. The genre
 * selection is an array; only the first reaches the backend for now.
 */
export function FilterBar({
  state,
  update,
  toggleGenre,
  clear,
  hasFilters,
  total,
}: {
  state: CatalogState;
  update: (patch: Partial<CatalogState>) => void;
  toggleGenre: (genre: string) => void;
  clear: () => void;
  hasFilters: boolean;
  total?: number;
}) {
  const { t } = useI18n();

  // Local echo of the text inputs, pushed to the URL after a short debounce.
  const [q, setQ] = useState(state.q);
  const [author, setAuthor] = useState(state.author);

  useEffect(() => setQ(state.q), [state.q]);
  useEffect(() => setAuthor(state.author), [state.author]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (q !== state.q) update({ q });
    }, 350);
    return () => clearTimeout(id);
  }, [q, state.q, update]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (author !== state.author) update({ author });
    }, 350);
    return () => clearTimeout(id);
  }, [author, state.author, update]);

  const field =
    'h-11 w-full rounded-full border border-line bg-card pl-11 pr-4 text-body-sm text-fg ' +
    'placeholder:text-fg-subtle focus:border-fg/50 focus:outline-none';

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="relative block">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('catalog.filter.q')}
            aria-label={t('catalog.filter.q')}
            className={field}
          />
        </label>
        <label className="relative block">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-subtle" />
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder={t('catalog.filter.author')}
            aria-label={t('catalog.filter.author')}
            className={field}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t('catalog.filter.genre')}>
        {FILTER_GENRES.map((genre) => {
          const active = state.genres.includes(genre);
          return (
            <button
              key={genre}
              type="button"
              aria-pressed={active}
              onClick={() => toggleGenre(genre)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-body-sm transition-colors',
                active
                  ? 'border-accent/40 bg-accent/15 text-accent'
                  : 'border-line text-fg-muted hover:border-line-strong hover:text-fg',
              )}
            >
              {genre}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-body-sm text-fg-muted">
            {t('catalog.sort')}
            <select
              value={state.sort}
              onChange={(e) => update({ sort: e.target.value })}
              className="h-9 rounded-full border border-line bg-card px-3 text-body-sm text-fg focus:border-fg/50 focus:outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </label>
          {hasFilters && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1.5 text-body-sm text-fg-muted transition-colors hover:text-fg"
            >
              <CloseIcon />
              {t('catalog.clear')}
            </button>
          )}
        </div>
        {total != null && (
          <p className="font-mono text-caption text-fg-subtle">
            {t('catalog.results', { count: total.toLocaleString() })}
          </p>
        )}
      </div>

      {state.genres.length > 1 && (
        <p className="text-caption text-fg-subtle">{t('catalog.genreNote')}</p>
      )}
    </div>
  );
}
