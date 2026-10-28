import { useState, type FormEvent } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { BookCard } from '@/components/ui/BookCard';
import { MOCK_BOOK_SUMMARIES } from '@/mocks/books';

/**
 * Home — scaffold entry point (nocturnal redesign).
 *
 * The hero floats directly on the night-sky canvas with a literary serif
 * headline (one amber word) and a pill search input. Below, the "Popular" grid
 * renders sample data; each card fades + rises in on scroll. Phase 2 swaps the
 * grid to live `/api/books` and wires the hero search to `/api/search`.
 */
export function HomePage() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Phase 2 wires this to /api/search + a results route.
  }

  return (
    <div className="flex flex-col gap-[var(--spacing-128)]">
      {/* Hero on the sky */}
      <section className="flex min-h-[62vh] flex-col items-center justify-center gap-[var(--spacing-24)] pt-[var(--spacing-64)] text-center">
        <Pill tone="accent" uppercase>
          {t('hero.eyebrow')}
        </Pill>

        <h1 className="max-w-[16ch] font-[family-name:var(--font-serif)] text-[var(--text-heading)] font-light leading-[1.04] text-[var(--text)] md:text-[var(--text-heading-lg)] lg:text-[var(--text-display)]">
          {t('hero.title.pre')} <em className="text-accent not-italic">{t('hero.title.accent')}</em>{' '}
          {t('hero.title.post')}
        </h1>

        <p className="max-w-[560px] text-[var(--text-body-lg)] leading-[1.5] text-[var(--text-muted)]">
          {t('hero.subtitle')}
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-[var(--spacing-8)] flex w-full max-w-[640px] items-center gap-[var(--spacing-8)] rounded-[var(--radius-inputs)] border border-[var(--hairline)] bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] p-[var(--spacing-8)] shadow-[var(--shadow-float)] backdrop-blur-sm"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('hero.search.placeholder')}
            aria-label={t('hero.search.placeholder')}
            className="min-w-0 flex-1 bg-transparent px-[var(--spacing-16)] py-[var(--spacing-8)] text-[var(--text-body)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <Button variant="accent" type="submit">
            {t('hero.search.button')}
          </Button>
        </form>
        <p className="text-[var(--text-body-sm)] text-[var(--text-muted)]">
          {t('hero.search.hint')}
        </p>
      </section>

      {/* Popular grid (sample data) */}
      <section className="flex flex-col gap-[var(--spacing-32)]">
        <div className="flex flex-col gap-[var(--spacing-8)] text-center">
          <h2 className="font-[family-name:var(--font-serif)] text-[var(--text-heading-sm)] font-normal text-[var(--text)]">
            {t('section.popular.title')}
          </h2>
          <p className="text-[var(--text-body)] text-[var(--text-muted)]">
            {t('section.popular.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-[var(--spacing-24)] sm:grid-cols-3 lg:grid-cols-4">
          {MOCK_BOOK_SUMMARIES.map((book, i) => (
            <BookCard key={book.id} book={book} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
