import { useI18n } from '@/i18n/I18nProvider';
import type { BookDetail } from '@/types/api';

interface Fact {
  key: string;
  label: string;
  value: string;
}

function buildFacts(book: BookDetail, t: ReturnType<typeof useI18n>['t']): Fact[] {
  const facts: Fact[] = [];
  const push = (key: string, label: string, value: string | number | null | undefined) => {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      facts.push({ key, label, value: String(value) });
    }
  };
  push(
    'rating',
    t('detail.fact.rating'),
    book.rating != null ? `★ ${book.rating.toFixed(2)}` : null,
  );
  push(
    'ratings',
    t('detail.fact.ratings'),
    book.numRatings != null ? book.numRatings.toLocaleString() : null,
  );
  push('liked', t('detail.fact.liked'), book.likedPercent != null ? `${book.likedPercent}%` : null);
  push('year', t('detail.fact.year'), book.publishYear);
  push('pages', t('detail.fact.pages'), book.pages);
  push('format', t('detail.fact.format'), book.bookFormat);
  push('language', t('detail.fact.language'), book.language);
  push('publisher', t('detail.fact.publisher'), book.publisher);
  return facts;
}

/**
 * The book's facts as a small constellation: each fact is a star joined to the
 * next by a thin line, with the value bright (amber for the headline fact) and
 * the label as a quiet caption. On small screens it degrades to a tidy grid;
 * the connecting lines only show from md up, where there is room to breathe.
 */
export function ConstellationFacts({ book }: { book: BookDetail }) {
  const { t } = useI18n();
  const facts = buildFacts(book, t);
  if (facts.length === 0) return null;

  return (
    <ul className="relative grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-3 md:grid-cols-4">
      {facts.map((fact, i) => (
        <li key={fact.key} className="relative">
          {/* connecting line to the next star */}
          {i < facts.length - 1 && (i + 1) % 4 !== 0 && (
            <span
              aria-hidden="true"
              className="absolute right-0 top-[7px] hidden h-px w-8 translate-x-full bg-gradient-to-r from-line-strong to-transparent md:block"
            />
          )}
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={
                fact.key === 'rating'
                  ? 'size-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]'
                  : 'size-1.5 rounded-full bg-fg/60'
              }
            />
            <span className="font-mono text-caption uppercase tracking-wider text-fg-subtle">
              {fact.label}
            </span>
          </span>
          <p
            className={
              'mt-1.5 text-subheading font-semibold ' +
              (fact.key === 'rating' ? 'text-accent' : 'text-fg')
            }
          >
            {fact.value}
          </p>
        </li>
      ))}
    </ul>
  );
}
