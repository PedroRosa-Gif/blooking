import { useI18n } from '@/i18n/I18nProvider';
import { useRecommendations } from '@/api/hooks';
import { useAuth } from '@/auth/AuthContext';
import { Section } from '@/components/layout/Section';
import { BookGrid } from '@/components/ui/BookGrid';
import { BookGridSkeleton } from '@/components/ui/BookCardSkeleton';
import { ErrorState } from '@/components/ui/StateView';
import { FavoriteRecommendationShelves } from '@/components/book/FavoriteRecommendationShelves';

/** US05 — full personalized recommendations page (auth-gated by the route). */
export function RecommendationsPage() {
  const { t } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const { data, isLoading, isError, error, refetch } = useRecommendations(50);

  const name = user?.displayName?.trim() || user?.username;

  return (
    <Section tone="sky" className="pb-28 pt-24">
      <header className="mb-10">
        <h1 className="text-4xl font-semibold tracking-[-0.035em] sm:text-headline">
          {name ? t('recs.titleNamed', { name }) : t('recs.title')}
        </h1>
        <p className="mt-3 max-w-xl text-lead text-fg-muted">{t('recs.page.subtitle')}</p>
      </header>

      {isLoading ? (
        <BookGridSkeleton count={12} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <BookGrid books={data ?? []} />
          <p className="mt-10 text-caption text-fg-subtle">{t('recs.page.note')}</p>
        </>
      )}

      <div className="mt-20">
        <FavoriteRecommendationShelves enabled={isAuthenticated} />
      </div>
    </Section>
  );
}
