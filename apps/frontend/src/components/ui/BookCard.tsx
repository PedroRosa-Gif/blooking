import { Link } from 'react-router-dom';
import type { BookSummary } from '@/types/api';
import { useI18n } from '@/i18n/I18nProvider';
import { useReveal } from '@/hooks/useReveal';
import { Pill } from './Pill';

function formatRatings(count: number | null, t: ReturnType<typeof useI18n>['t']): string {
  if (count == null) return t('card.unrated');
  const compact = new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(count);
  return t('card.ratings', { count: compact });
}

/**
 * Book card: surface tile, soft rounding, cover image, serif-free title, muted
 * meta, one amber-tinted genre chip. Fades + rises in on scroll (the "books
 * emerge" effect), staggered by `index`.
 */
export function BookCard({ book, index = 0 }: { book: BookSummary; index?: number }) {
  const { t } = useI18n();
  const { ref, visible } = useReveal<HTMLAnchorElement>();
  const primaryGenre = book.genres[0];

  return (
    <Link
      ref={ref}
      to={`/books/${book.id}`}
      style={{ transitionDelay: visible ? `${Math.min(index, 8) * 60}ms` : '0ms' }}
      className={[
        'reveal group block overflow-hidden rounded-[var(--radius-cards)]',
        'bg-[var(--surface)] shadow-[var(--shadow-card)]',
        'transition-transform duration-200 hover:-translate-y-1',
        visible ? 'is-visible' : '',
      ].join(' ')}
    >
      <div className="aspect-[2/3] w-full overflow-hidden bg-[var(--surface-2)]">
        {book.coverImg ? (
          <img
            src={book.coverImg}
            alt={`${book.title} cover`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-[var(--spacing-16)] text-center text-[var(--text-body-sm)] text-[var(--text-muted)]">
            {book.title}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-[var(--spacing-8)] p-[var(--spacing-16)]">
        {primaryGenre && (
          <div>
            <Pill tone="surface">{primaryGenre}</Pill>
          </div>
        )}
        <h3 className="line-clamp-2 font-[family-name:var(--font-sans)] text-[var(--text-body)] font-semibold leading-snug text-[var(--text)]">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-[var(--text-body-sm)] text-[var(--text-muted)]">
          {book.author}
        </p>
        <p className="flex items-center gap-[var(--spacing-8)] text-[var(--text-body-sm)] text-[var(--text-muted)]">
          {book.rating != null && (
            <span className="font-semibold text-[var(--accent)]">★ {book.rating.toFixed(2)}</span>
          )}
          <span>{formatRatings(book.numRatings, t)}</span>
        </p>
      </div>
    </Link>
  );
}
