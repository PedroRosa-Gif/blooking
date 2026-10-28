import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useFavoriteIds, useToggleFavorite } from '@/api/favoriteHooks';
import { useI18n } from '@/i18n/I18nProvider';
import { hasFavorite } from '@/lib/favoriteSet';
import { cn } from '@/lib/cn';
import { HeartIcon } from '@/components/ui/Icon';

type Variant = 'solid' | 'icon';

/**
 * Heart toggle for favoriting a book.
 *  - `solid`: a labelled pill button (book detail hero).
 *  - `icon`:  a round icon button that overlays a cover (cards).
 *
 * Logged out, it sends the user to login (remembering where they were). Logged
 * in, it toggles optimistically via useToggleFavorite. The filled state comes
 * from the shared favorite-id set.
 */
export function FavoriteButton({
  bookId,
  variant = 'solid',
  className,
}: {
  bookId: number;
  variant?: Variant;
  className?: string;
}) {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: ids } = useFavoriteIds();
  const toggle = useToggleFavorite();

  const favorited = hasFavorite(ids, bookId);
  const label = favorited ? t('fav.remove') : t('fav.add');

  function onClick(e: React.MouseEvent) {
    e.preventDefault(); // cards wrap the button in a <Link>
    e.stopPropagation();
    if (!isAuthenticated) {
      const from = `${location.pathname}${location.search}`;
      navigate(`/login?from=${encodeURIComponent(from)}`);
      return;
    }
    toggle.mutate({ bookId, favorited });
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={favorited}
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-full border backdrop-blur-md transition-colors',
          favorited
            ? 'border-accent/50 bg-accent/20 text-accent'
            : 'border-white/15 bg-black/40 text-white hover:bg-black/60',
          className,
        )}
      >
        <HeartIcon filled={favorited} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={favorited}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-full border px-5 text-body-sm font-medium transition-colors',
        favorited
          ? 'border-accent/50 bg-accent/15 text-accent hover:bg-accent/25'
          : 'border-line-strong text-fg hover:bg-fg/5',
        className,
      )}
    >
      <HeartIcon filled={favorited} />
      {label}
    </button>
  );
}
