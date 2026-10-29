import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { useInfiniteFavorites } from '@/api/favoriteHooks';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { BookSummary } from '@/types/api';
import { Section } from '@/components/layout/Section';
import { BookGrid } from '@/components/ui/BookGrid';
import { BookGridSkeleton } from '@/components/ui/BookCardSkeleton';
import { EmptyState, ErrorState } from '@/components/ui/StateView';
import { Spinner } from '@/components/ui/Spinner';
import { buttonClasses } from '@/components/ui/Button';
import { HeartIcon } from '@/components/ui/Icon';

/** US11 — the user's favorite books, newest first, with infinite scroll. */
export function FavoritesPage() {
  const { t } = useI18n();
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteFavorites();

  const books: BookSummary[] = useMemo(() => data?.pages.flatMap((p) => p.content) ?? [], [data]);
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
          {t('favorites.title')}
        </h1>
        <p className="mt-3 max-w-xl text-lead text-fg-muted">
          {total != null && total > 0
            ? t('favorites.count', { count: total.toLocaleString() })
            : t('favorites.subtitle')}
        </p>
      </header>

      {isLoading ? (
        <BookGridSkeleton count={10} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : books.length === 0 ? (
        <EmptyState
          icon={<HeartIcon size={28} />}
          title={t('favorites.empty.title')}
          body={t('favorites.empty.body')}
          action={
            <Link to="/books" className={buttonClasses({ size: 'md' })}>
              {t('favorites.empty.cta')}
            </Link>
          }
        />
      ) : (
        <>
          <BookGrid books={books} />
          <div ref={sentinelRef} aria-hidden="true" className="h-px" />
          <div className="mt-10 flex min-h-8 justify-center">
            {isFetchingNextPage ? (
              <Spinner />
            ) : !hasNextPage ? (
              <p className="font-mono text-caption text-fg-subtle">{t('favorites.end')}</p>
            ) : null}
          </div>
        </>
      )}
    </Section>
  );
}
