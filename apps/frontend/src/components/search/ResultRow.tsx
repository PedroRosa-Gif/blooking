import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { BookSummary } from '@/types/api';
import { useI18n } from '@/i18n/I18nProvider';
import { displayAuthors } from '@/lib/authors';
import { fromState } from '@/lib/navigation';

/**
 * Compact result row for list view: cover, title, author and the facts you
 * compare while scanning (year, rating, genres).
 */
export function ResultRow({ book, rank }: { book: BookSummary; rank?: number }) {
  const { t } = useI18n();
  const location = useLocation();
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(book.coverImg) && !failed;

  return (
    <Link
      to={`/books/${book.id}`}
      state={fromState(location.pathname, location.search)}
      className="group flex gap-4 rounded-card border border-line bg-card/50 p-3 transition-colors hover:border-line-strong hover:bg-card"
    >
      {rank != null && (
        <span className="hidden w-6 shrink-0 self-center text-center font-mono text-caption text-fg-subtle sm:block">
          {String(rank).padStart(2, '0')}
        </span>
      )}
      <div className="aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-md bg-card-2 ring-1 ring-line sm:w-16">
        {showImage ? (
          <img
            src={book.coverImg ?? undefined}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <h3 className="truncate text-body font-medium text-fg group-hover:text-accent">
          {book.title}
        </h3>
        <p className="truncate text-body-sm text-fg-muted">{displayAuthors(book.author)}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-caption text-fg-subtle">
          {book.rating != null && <span className="text-accent">★ {book.rating.toFixed(2)}</span>}
          {book.publishYear != null && <span>{book.publishYear}</span>}
          {book.numRatings != null && (
            <span>{t('card.ratings', { count: book.numRatings.toLocaleString() })}</span>
          )}
        </p>
        {book.genres.length > 0 && (
          <p className="hidden truncate text-caption text-fg-subtle sm:block">
            {book.genres.slice(0, 4).join(' · ')}
          </p>
        )}
      </div>
    </Link>
  );
}
