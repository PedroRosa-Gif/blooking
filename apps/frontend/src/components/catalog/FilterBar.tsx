import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import { FILTER_GENRES, SORT_OPTIONS } from '@/lib/genres';
import type { CatalogState } from '@/hooks/useCatalogParams';
import { ArrowRightIcon, CloseIcon, SearchIcon } from '@/components/ui/Icon';

/**
 * Catalog filters: author (debounced into the URL), multi-select genre chips and
 * a sort select. Text search is not here on purpose: it lives on the Search
 * page, and a link says so. Genres are an array in the UI; only the first
 * reaches the backend for now (see api/books.ts).
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

  // Local echo of the author input, pushed to the URL after a short pause.
  const [author, setAuthor] = useState(state.author);
  useEffect(() => setAuthor(state.author), [state.author]);
  useEffect(() => {
    const id = setTimeout(() => {
      if (author !== state.author) update({ author });
    }, 350);
    return () => clearTimeout(id);
  }, [author, state.author, update]);

  return (
    <div className="flex flex-col gap-6">
      {/* Where to go for free-text search */}
      <Link
        to="/search"
        className="group flex items-center justify-between gap-4 rounded-card border border-line bg-card/50 px-5 py-4 transition-colors hover:border-line-strong hover:bg-card"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-fg-muted">
            <SearchIcon />
          </span>
          <span className="min-w-0">
            <span className="block text-body-sm font-medium text-fg">{t('catalog.searchCta')}</span>
            <span className="block truncate text-caption text-fg-muted">
              {t('catalog.searchCta.body')}
            </span>
          </span>
        </span>
        <ArrowRightIcon className="shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5" />
      </Link>

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
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle" />
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={t('catalog.filter.author')}
              aria-label={t('catalog.filter.author')}
              className="h-9 w-56 rounded-full border border-line bg-card pl-10 pr-4 text-body-sm text-fg placeholder:text-fg-subtle focus:border-fg/50 focus:outline-none"
            />
          </label>
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
          <p className="font-mono text-caption text-fg-subtle" aria-live="polite">
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
