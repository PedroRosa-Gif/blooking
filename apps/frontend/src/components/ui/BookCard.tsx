import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { BookSummary } from '@/types/api';
import { useI18n } from '@/i18n/I18nProvider';
import { useFavoriteIds } from '@/api/favoriteHooks';
import { cn } from '@/lib/cn';
import { displayAuthors } from '@/lib/authors';
import { hasFavorite } from '@/lib/favoriteSet';
import { fromState } from '@/lib/navigation';
import { FavoriteButton } from '@/components/book/FavoriteButton';

/** Format with the app's language, not the browser's, so the card never mixes locales. */
function compact(count: number, lang: string): string {
  return new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : 'en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(count);
}

/**
 * Cover-first book tile (Apple Books pattern): the cover carries the card,
 * metadata sits quietly below. No frame, so rows of covers read as a shelf.
 */
export function BookCard({ book, className }: { book: BookSummary; className?: string }) {
  const { t, lang } = useI18n();
  const location = useLocation();
  const { data: favIds } = useFavoriteIds();
  const favorited = hasFavorite(favIds, book.id);
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(book.coverImg) && !failed;

  return (
    <Link
      to={`/books/${book.id}`}
      state={fromState(location.pathname, location.search)}
      className={cn('group block w-full', className)}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-image bg-card-2 shadow-cover ring-1 ring-line transition duration-300 group-hover:-translate-y-1 group-hover:ring-line-strong">
        <div
          className="absolute right-2 top-2 z-10 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 data-[fav=true]:opacity-100"
          data-fav={favorited}
        >
          <FavoriteButton bookId={book.id} variant="icon" />
        </div>
        {showImage ? (
          <img
            src={book.coverImg ?? undefined}
            alt={`${book.title} cover`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-card-2 to-card p-4 text-center text-body-sm font-medium text-fg-muted">
            {book.title}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-2 text-body-sm font-medium leading-snug text-fg">{book.title}</h3>
        <p className="line-clamp-1 text-caption text-fg-muted">{displayAuthors(book.author)}</p>
        <p className="flex items-center gap-2 font-mono text-caption text-fg-subtle">
          {book.rating != null && <span className="text-accent">★ {book.rating.toFixed(2)}</span>}
          <span>
            {book.numRatings != null
              ? t('card.ratings', { count: compact(book.numRatings, lang) })
              : t('card.unrated')}
          </span>
        </p>
      </div>
    </Link>
  );
}
