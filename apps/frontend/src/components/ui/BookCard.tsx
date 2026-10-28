import { Link } from 'react-router-dom';
import type { BookSummary } from '@/types/api';
import { useI18n } from '@/i18n/I18nProvider';
import { Pill } from './Pill';

function formatRatings(count: number | null, t: ReturnType<typeof useI18n>['t']): string {
  if (count == null) return t('card.unrated');
  const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(count);
  return t('card.ratings', { count: compact });
}

/**
 * Photo-profile-style book card: white surface, 24px radius, hairline outline,
 * portrait cover image, ink title, slate meta line, one pastel genre chip.
 */
export function BookCard({ book }: { book: BookSummary }) {
  const { t } = useI18n();
  const primaryGenre = book.genres[0];

  return (
    <Link
      to={`/books/${book.id}`}
      className="group block overflow-hidden rounded-[var(--radius-cards)] bg-[var(--color-white-canvas)] shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-elevated)]"
    >
      <div className="aspect-[2/3] w-full overflow-hidden bg-[var(--color-mist-hairline)]">
        {book.coverImg ? (
          <img
            src={book.coverImg}
            alt={`${book.title} cover`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-[var(--spacing-16)] text-center text-[var(--text-body)] text-[var(--color-slate-helper)]">
            {book.title}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-[var(--spacing-8)] p-[var(--spacing-16)]">
        {primaryGenre && (
          <div>
            <Pill tone="sky">{primaryGenre}</Pill>
          </div>
        )}
        <h3 className="line-clamp-2 font-[var(--font-switzer)] text-[var(--text-body)] font-semibold leading-snug text-[var(--color-portrait-ink)]">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-[var(--text-caption)] text-[var(--color-slate-helper)]">
          {book.author}
        </p>
        <p className="flex items-center gap-[var(--spacing-8)] text-[var(--text-caption)] text-[var(--color-slate-helper)]">
          {book.rating != null && (
            <span className="font-semibold text-[var(--color-portrait-ink)]">★ {book.rating.toFixed(2)}</span>
          )}
          <span>{formatRatings(book.numRatings, t)}</span>
        </p>
      </div>
    </Link>
  );
}
