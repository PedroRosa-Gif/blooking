import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { useSearch } from '@/api/hooks';
import { clearRecent, readRecent, saveRecent } from '@/lib/recentSearches';
import {
  EMPTY_REFINEMENT,
  activeCount,
  fromSearchParams,
  isRefined,
  refine,
  toSearchParams,
  type Refinement,
} from '@/lib/refine';
import { Section } from '@/components/layout/Section';
import { FiltersPanel } from '@/components/search/FiltersPanel';
import { ResultRow } from '@/components/search/ResultRow';
import { ActiveFilters, ResultsToolbar, type ViewMode } from '@/components/search/ResultsToolbar';
import { BookGrid } from '@/components/ui/BookGrid';
import { BookGridSkeleton } from '@/components/ui/BookCardSkeleton';
import { Button } from '@/components/ui/Button';
import { SearchIcon } from '@/components/ui/Icon';
import { EmptyState, ErrorState } from '@/components/ui/StateView';
import { Tag } from '@/components/ui/Tag';

const VIEW_KEY = 'blooking.searchView';
const SUGGESTIONS = ['hero.chip1', 'hero.chip2', 'hero.chip3'] as const;

function readView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

/**
 * US01 — the one place to search. Natural-language, semantic + keyword search
 * (`/api/search`), then refine the results by genre, decade and rating, sort
 * them, and switch between grid and list. The query and every refinement live in
 * the URL, so back/forward, reloads and shared links all land on the same view.
 */
export function SearchPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim();

  const [input, setInput] = useState(q);
  useEffect(() => setInput(q), [q]);

  const refinement = useMemo(() => fromSearchParams(params), [params]);
  const [view, setView] = useState<ViewMode>(readView);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => readRecent());

  const { data, isLoading, isFetching, isError, error, refetch } = useSearch(q, 50);
  const results = useMemo(() => data ?? [], [data]);

  // Remember a query once it has actually returned something to show.
  useEffect(() => {
    if (q && data) setRecent(saveRecent(q));
  }, [q, data]);

  const visible = useMemo(() => refine(results, refinement), [results, refinement]);

  function setRefinement(next: Refinement) {
    setParams((prev) => toSearchParams(next, new URLSearchParams(prev)), { replace: true });
  }

  function setView2(next: ViewMode) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* ignore */
    }
  }

  function search(text: string) {
    const trimmed = text.trim();
    // A new search starts clean: refinements belong to the previous results.
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    search(input);
  }

  const hasQuery = q !== '';
  const refined = isRefined(refinement);
  const filterCount = activeCount(refinement);

  return (
    <Section tone="sky" className="pb-28 pt-24">
      <header className="mb-8">
        <Tag tone="accent">{t('search.eyebrow')}</Tag>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-headline">
          {t('search.title')}
        </h1>
        <p className="mt-3 max-w-2xl text-lead text-fg-muted">{t('search.subtitle')}</p>

        <form
          onSubmit={onSubmit}
          role="search"
          className="mt-8 flex h-14 w-full max-w-3xl items-center gap-2 rounded-full border border-line-strong bg-card pl-5 pr-2 transition-colors focus-within:border-fg/60"
        >
          <SearchIcon size={20} className="shrink-0 text-fg-subtle" />
          <input
            type="search"
            autoFocus={!hasQuery}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('hero.search.placeholder')}
            aria-label={t('hero.search.placeholder')}
            className="min-w-0 flex-1 bg-transparent text-body text-fg placeholder:text-fg-subtle focus:outline-none"
          />
          <Button type="submit" size="md">
            {t('hero.search.button')}
          </Button>
        </form>
      </header>

      {!hasQuery ? (
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-mono text-caption uppercase tracking-wider text-fg-subtle">
              {t('search.try')}
            </h2>
            <ul className="mt-4 flex flex-col gap-2">
              {SUGGESTIONS.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => search(t(key))}
                    className="flex w-full items-center gap-3 rounded-card border border-line bg-card/50 px-4 py-3 text-left text-body-sm text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                  >
                    <SearchIcon className="shrink-0 text-fg-subtle" />
                    {t(key)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {recent.length > 0 && (
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-caption uppercase tracking-wider text-fg-subtle">
                  {t('search.recent')}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    clearRecent();
                    setRecent([]);
                  }}
                  className="text-body-sm text-fg-muted transition-colors hover:text-fg"
                >
                  {t('search.recent.clear')}
                </button>
              </div>
              <ul className="mt-4 flex flex-wrap gap-2">
                {recent.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      onClick={() => search(r)}
                      className="rounded-full border border-line px-3.5 py-1.5 text-body-sm text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                    >
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : isLoading ? (
        <BookGridSkeleton count={10} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<SearchIcon size={28} />}
          title={t('search.empty.title', { q })}
          body={t('search.empty.body')}
        />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[17rem_1fr]">
          {/* Filters: always visible on desktop, a disclosure on small screens */}
          <aside aria-label={t('refine.title')}>
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              className="mb-4 flex h-10 w-full items-center justify-between rounded-full border border-line px-5 text-body-sm font-medium text-fg lg:hidden"
            >
              <span>
                {t('refine.title')}
                {filterCount > 0 && <span className="ml-2 text-accent">({filterCount})</span>}
              </span>
              <span className="text-fg-subtle">{filtersOpen ? '−' : '+'}</span>
            </button>
            <div className={filtersOpen ? 'block' : 'hidden lg:sticky lg:top-24 lg:block'}>
              <div className="rounded-card border border-line bg-card/50 p-5">
                <FiltersPanel
                  books={results}
                  total={results.length}
                  value={refinement}
                  onChange={setRefinement}
                />
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-caption text-fg-subtle" aria-live="polite">
                {refined && visible.length !== results.length
                  ? t('search.countOf', { shown: visible.length, total: results.length, q })
                  : t('search.count', { count: results.length, q })}
              </p>
              <ResultsToolbar
                sort={refinement.sort}
                onSort={(sort) => setRefinement({ ...refinement, sort })}
                view={view}
                onView={setView2}
              />
            </div>

            <ActiveFilters value={refinement} onChange={setRefinement} />

            <div className={`mt-5 ${isFetching ? 'opacity-70 transition-opacity' : ''}`}>
              {visible.length === 0 ? (
                <EmptyState
                  icon={<SearchIcon size={28} />}
                  title={t('refine.empty.title')}
                  body={t('refine.empty.body')}
                />
              ) : view === 'grid' ? (
                <BookGrid books={visible} />
              ) : (
                <ul className="flex flex-col gap-3">
                  {visible.map((b, i) => (
                    <li key={b.id}>
                      <ResultRow
                        book={b}
                        rank={refinement.sort === 'relevance' ? i + 1 : undefined}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {results.length >= 50 && (
              <p className="mt-8 text-caption text-fg-subtle">{t('search.limitNote')}</p>
            )}
            {filterCount > 0 && visible.length === 0 && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRefinement({ ...EMPTY_REFINEMENT, sort: refinement.sort })}
                >
                  {t('refine.clear')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
