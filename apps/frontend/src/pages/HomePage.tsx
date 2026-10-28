import { useState, type FormEvent } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { BookCard } from '@/components/ui/BookCard';
import { MOCK_BOOK_SUMMARIES } from '@/mocks/books';

/**
 * Home — scaffold entry point.
 *
 * Proves the design language (hero with a rainbow-italic word + a pill search
 * input) and the data wiring (BookCard grid typed against the real backend
 * contract), rendering sample data so no backend is required. In Phase 2 the
 * grid switches to live `/api/books` data and the hero search to `/api/search`.
 */
export function HomePage() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Phase 2 wires this to /api/search + a results route.
  }

  return (
    <div className="flex flex-col gap-[var(--spacing-80)]">
      {/* Hero */}
      <section className="flex flex-col items-center gap-[var(--spacing-24)] pt-[var(--spacing-48)] text-center">
        <Pill tone="peach" uppercase>
          {t('hero.eyebrow')}
        </Pill>

        <h1 className="max-w-[900px] font-[var(--font-basier-circle)] text-[var(--text-heading)] font-semibold leading-[1.05] tracking-[-1.15px] text-[var(--color-portrait-ink)] md:text-[var(--text-heading-lg)] lg:text-[64px]">
          {t('hero.title.pre')}{' '}
          <em className="text-rainbow not-italic">{t('hero.title.accent')}</em>{' '}
          {t('hero.title.post')}
        </h1>

        <p className="max-w-[560px] text-[var(--text-body-lg)] leading-[1.45] text-[var(--color-graphite-body)]">
          {t('hero.subtitle')}
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-[var(--spacing-8)] flex w-full max-w-[640px] items-center gap-[var(--spacing-8)] rounded-[var(--radius-tags)] bg-[var(--color-white-canvas)] p-[var(--spacing-8)] shadow-[var(--shadow-card)]"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('hero.search.placeholder')}
            aria-label={t('hero.search.placeholder')}
            className="min-w-0 flex-1 bg-transparent px-[var(--spacing-16)] py-[var(--spacing-8)] text-[var(--text-body)] text-[var(--color-portrait-ink)] placeholder:text-[var(--color-slate-helper)] focus:outline-none"
          />
          <Button variant="rainbow" type="submit">
            {t('hero.search.button')}
          </Button>
        </form>
        <p className="text-[var(--text-caption)] text-[var(--color-slate-helper)]">
          {t('hero.search.hint')}
        </p>
      </section>

      {/* Popular grid (sample data) */}
      <section className="flex flex-col gap-[var(--spacing-24)]">
        <div className="flex flex-col gap-[var(--spacing-4)]">
          <h2 className="font-[var(--font-basier-circle)] text-[var(--text-heading-sm)] font-semibold tracking-[-0.4px] text-[var(--color-portrait-ink)]">
            {t('section.popular.title')}
          </h2>
          <p className="text-[var(--text-body)] text-[var(--color-slate-helper)]">
            {t('section.popular.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-[var(--spacing-24)] sm:grid-cols-3 lg:grid-cols-4">
          {MOCK_BOOK_SUMMARIES.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>
    </div>
  );
}
