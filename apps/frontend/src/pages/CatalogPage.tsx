import { useMemo } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { useInfiniteBooks } from '@/api/hooks';
import { useCatalogParams } from '@/hooks/useCatalogParams';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { BookSummary } from '@/types/api';
import { Section } from '@/components/layout/Section';
import { FilterBar } from '@/components/catalog/FilterBar';
import { BookGrid } from '@/components/ui/BookGrid';
import { BookGridSkeleton } from '@/components/ui/BookCardSkeleton';
import { EmptyState, ErrorState } from '@/components/ui/StateView';
import { Spinner } from '@/components/ui/Spinner';
import { BookOpenIcon } from '@/components/ui/Icon';

/**
 * US02 + US03 — browse the whole catalog with structured filters and infinite
 * scroll. Free-text search is on the Search page; an old link that still carries
 * `?q=` is sent there instead of silently ignoring the text.
 */
export function CatalogPage() {
  const [params] = useSearchParams();
  const legacyQuery = params.get('q')?.trim();
  if (legacyQuery) {
    return <Navigate to={`/search?q=${encodeURIComponent(legacyQuery)}`} replace />;
  }
  return <CatalogView />;
}

function CatalogView() {
  const { t } = useI18n();
  const { state, update, toggleGenre, clear, hasFilters } = useCatalogParams();

  const filters = useMemo(
    () => ({ author: state.author, genres: state.genres, sort: state.sort }),
    [state.author, state.genres, state.sort],
  );

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isFetching,
  } = useInfiniteBooks(filters);

  const books: BookSummary[] = useMemo(
    () => data?.pages.flatMap((p) => p.content).filter(Boolean) ?? [],
    [data],
  );
  const total = data?.pages[0]?.totalElements;

  const sentinelRef = useInfiniteScroll({
    onReachEnd: fetchNextPage,
    canLoadMore: Boolean(hasNextPage),
    isLoading: isFetchingNextPage,
  });

  return (
    <Section tone="sky" className="pb-28 pt-24">
      <header className="mb-10">
        <h1 className="text-4xl font-semibold tracking-[-0.035em] sm:text-headline">
          {t('catalog.title')}
        </h1>
        <p className="mt-3 max-w-xl text-lead text-fg-muted">{t('catalog.subtitle')}</p>
      </header>

      <FilterBar
        state={state}
        update={update}
        toggleGenre={toggleGenre}
        clear={clear}
        hasFilters={hasFilters}
        total={total}
      />

      <div className="mt-12">
        {isLoading ? (
          <BookGridSkeleton count={15} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : books.length === 0 ? (
          <EmptyState
            icon={<BookOpenIcon size={28} />}
            title={t('catalog.empty.title')}
            body={t('catalog.empty.body')}
          />
        ) : (
          <>
            <div
              className={isFetching && !isFetchingNextPage ? 'opacity-60 transition-opacity' : ''}
            >
              <BookGrid books={books} />
            </div>

            <div ref={sentinelRef} aria-hidden="true" className="h-px" />

            <div className="mt-10 flex min-h-8 justify-center">
              {isFetchingNextPage ? (
                <Spinner />
              ) : !hasNextPage ? (
                <p className="font-mono text-caption text-fg-subtle">{t('catalog.end')}</p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </Section>
  );
}
