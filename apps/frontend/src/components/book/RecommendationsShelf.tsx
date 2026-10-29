import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { useRecommendations } from '@/api/hooks';
import { useAuth } from '@/auth/AuthContext';
import { BookShelf } from '@/components/ui/BookShelf';
import { BookCardSkeleton } from '@/components/ui/BookCardSkeleton';

/**
 * "For you" shelf on the Home page (US05). Only renders for a signed-in user.
 * The backend always returns something (popularity cold-start), so there is no
 * empty state; on error the shelf simply hides rather than breaking the page.
 */
export function RecommendationsShelf() {
  const { t } = useI18n();
  const { isAuthenticated, user } = useAuth();
  const { data, isLoading, isError } = useRecommendations(16, isAuthenticated);

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div>
        <div className="mb-6 h-7 w-48 animate-pulse rounded bg-card-2" />
        <div className="-mx-6 flex gap-5 overflow-hidden px-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <BookCardSkeleton key={i} className="w-40 shrink-0 sm:w-44" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data || data.length === 0) return null;

  const name = user?.displayName?.trim() || user?.username;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Link
          to="/recommendations"
          className="text-body-sm font-medium text-fg-muted transition-colors hover:text-fg"
        >
          {t('recs.seeAll')}
        </Link>
      </div>
      <BookShelf
        id="for-you"
        title={name ? t('recs.titleNamed', { name }) : t('recs.title')}
        subtitle={t('recs.subtitle')}
        books={data}
      />
    </div>
  );
}
