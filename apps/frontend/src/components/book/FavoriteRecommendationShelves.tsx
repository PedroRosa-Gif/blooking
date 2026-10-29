import { useI18n } from '@/i18n/I18nProvider';
import { useFavoriteRecommendations } from '@/api/hooks';
import { BookShelf } from '@/components/ui/BookShelf';
import { BookCardSkeleton } from '@/components/ui/BookCardSkeleton';

/**
 * "Because you liked X" section on the Recommendations page (US05): one
 * horizontally scrolling shelf per recent favorite, each anchored on a book the
 * user saved. Auth-gated by the caller passing `enabled`.
 *
 * Unlike the main recommendations grid, this CAN be empty — a user with no
 * favorites (or none with usable embeddings) gets nothing — so it renders
 * nothing in that case, and also hides on error rather than breaking the page.
 */
export function FavoriteRecommendationShelves({ enabled = true }: { enabled?: boolean }) {
  const { t } = useI18n();
  const { data, isLoading, isError } = useFavoriteRecommendations(enabled);

  if (!enabled) return null;

  if (isLoading) {
    return (
      <section className="flex flex-col gap-12">
        {Array.from({ length: 2 }).map((_, s) => (
          <div key={s}>
            <div className="mb-6 h-7 w-56 animate-pulse rounded bg-card-2" />
            <div className="-mx-6 flex gap-5 overflow-hidden px-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <BookCardSkeleton key={i} className="w-40 shrink-0 sm:w-44" />
              ))}
            </div>
          </div>
        ))}
      </section>
    );
  }

  if (isError || !data || data.length === 0) return null;

  return (
    <section className="flex flex-col gap-12">
      <h2 className="text-2xl font-semibold tracking-[-0.02em] text-fg">
        {t('recs.becauseYouLiked.heading')}
      </h2>
      {data.map(({ source, similar }) => (
        <BookShelf
          key={source.id}
          id={`because-${source.id}`}
          title={t('recs.becauseYouLiked.title', { title: source.title })}
          subtitle={t('recs.becauseYouLiked.subtitle', { author: source.author })}
          books={similar}
        />
      ))}
    </section>
  );
}
