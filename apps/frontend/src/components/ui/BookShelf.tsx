import { useCallback, useEffect, useRef, useState } from 'react';
import type { BookSummary } from '@/types/api';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import { BookCard } from './BookCard';
import { ChevronLeftIcon, ChevronRightIcon } from './Icon';
import { Tag } from './Tag';

const arrowClass =
  'inline-flex size-9 items-center justify-center rounded-full border border-line text-fg-muted transition-colors ' +
  'hover:border-line-strong hover:text-fg disabled:pointer-events-none disabled:opacity-30';

/**
 * One genre shelf: title row with a count and prev/next arrows, then a
 * horizontally scrolling, snap-aligned row of covers.
 */
export function BookShelf({
  id,
  title,
  subtitle,
  books,
}: {
  id: string;
  title: string;
  subtitle: string;
  books: BookSummary[];
}) {
  const { t } = useI18n();
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    update();
    const el = rowRef.current;
    el?.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update]);

  function page(direction: 1 | -1) {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' });
  }

  return (
    <div id={id} className="scroll-mt-24">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="text-title font-semibold text-fg">{title}</h3>
            <Tag>{t('shelf.count', { count: books.length })}</Tag>
          </div>
          <p className="mt-1 text-body-sm text-fg-muted">{subtitle}</p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => page(-1)}
            disabled={!canPrev}
            aria-label={t('shelf.prev')}
            className={arrowClass}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            disabled={!canNext}
            aria-label={t('shelf.next')}
            className={arrowClass}
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div
        ref={rowRef}
        className={cn(
          'no-scrollbar shelf-mask -mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-6 pt-1',
        )}
      >
        {books.map((book) => (
          <BookCard key={book.id} book={book} className="w-40 shrink-0 snap-start sm:w-44" />
        ))}
      </div>
    </div>
  );
}
