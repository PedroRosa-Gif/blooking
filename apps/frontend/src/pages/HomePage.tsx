import { useState, type FormEvent } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { Card } from '@/components/ui/Card';
import { Reveal } from '@/components/ui/Reveal';
import { BookCard } from '@/components/ui/BookCard';
import { Section } from '@/components/layout/Section';
import { MOCK_BOOK_SUMMARIES } from '@/mocks/books';

/**
 * Home — rebuilt around the design_v2 scroll narrative (alternating sky /
 * surface bands, headlines floating on the sky, content emerging on scroll)
 * with design_v1 polish (quiet frame, soft cards, generous rhythm).
 *
 * Bands, top → bottom:
 *   Hero (sky) → How it works (surface) → Why Blooking (sky) →
 *   Popular grid (surface) → CTA (sky)
 */
export function HomePage() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Phase 2 wires this to /api/search + a results route.
  }

  return (
    <>
      {/* ───────── Hero (sky) ───────── */}
      <Section band="sky" className="pb-[var(--spacing-80)] pt-[var(--spacing-128)]">
        <div className="flex min-h-[72vh] flex-col items-center justify-center gap-[var(--spacing-24)] text-center">
          <Reveal>
            <Pill tone="accent" uppercase>
              {t('hero.eyebrow')}
            </Pill>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="max-w-[16ch] font-[family-name:var(--font-serif)] text-[var(--text-heading)] font-light leading-[1.02] text-[var(--text)] md:text-[var(--text-heading-lg)] lg:text-[var(--text-display)]">
              {t('hero.title.pre')}{' '}
              <em className="text-accent not-italic">{t('hero.title.accent')}</em>{' '}
              {t('hero.title.post')}
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mx-auto max-w-[560px] text-[var(--text-body-lg)] leading-[1.5] text-[var(--text-muted)]">
              {t('hero.subtitle')}
            </p>
          </Reveal>

          <Reveal delay={180} className="w-full">
            <form
              onSubmit={onSubmit}
              className="mx-auto mt-[var(--spacing-8)] flex w-full max-w-[640px] items-center gap-[var(--spacing-8)] rounded-[var(--radius-inputs)] border border-[var(--hairline)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] p-[var(--spacing-8)] shadow-[var(--shadow-float)] backdrop-blur-md"
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
          </Reveal>

          <Reveal delay={220}>
            <p className="text-[var(--text-body-sm)] text-[var(--text-muted)]">
              {t('hero.search.hint')}
            </p>
          </Reveal>

          {/* scroll cue */}
          <Reveal delay={320} className="mt-[var(--spacing-32)]">
            <div className="flex flex-col items-center gap-[var(--spacing-8)] text-[var(--text-muted)]">
              <span className="text-[var(--text-caption)] uppercase tracking-[0.12em]">
                {t('hero.scroll')}
              </span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="animate-bounce"
              >
                <path d="M12 5v14M6 13l6 6 6-6" />
              </svg>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ───────── How it works (surface) ───────── */}
      <Section band="surface" className="py-[var(--spacing-80)]">
        <Reveal className="flex flex-col items-center gap-[var(--spacing-8)] text-center">
          <Pill tone="surface" uppercase>
            {t('how.eyebrow')}
          </Pill>
          <h2 className="font-[family-name:var(--font-serif)] text-[var(--text-heading-sm)] font-normal text-[var(--text)] md:text-[var(--text-heading)]">
            {t('how.title')}
          </h2>
        </Reveal>

        <div className="mt-[var(--spacing-48)] grid gap-[var(--spacing-24)] md:grid-cols-3">
          {[1, 2, 3].map((n, i) => (
            <Reveal key={n} delay={i * 90}>
              <Card className="flex h-full flex-col gap-[var(--spacing-12)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-tags)] border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] font-[family-name:var(--font-serif)] text-[var(--text-subheading)] text-[var(--accent)]">
                  {n}
                </span>
                <h3 className="font-[family-name:var(--font-sans)] text-[var(--text-subheading)] font-semibold text-[var(--text)]">
                  {t(`how.step${n}.title`)}
                </h3>
                <p className="text-[var(--text-body-sm)] leading-relaxed text-[var(--text-muted)]">
                  {t(`how.step${n}.body`)}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ───────── Why Blooking (sky, split) ───────── */}
      <Section band="sky" className="py-[var(--spacing-128)]">
        <div className="grid items-center gap-[var(--spacing-48)] md:grid-cols-2">
          <Reveal className="flex flex-col gap-[var(--spacing-16)]">
            <Pill tone="accent" uppercase>
              {t('feature.eyebrow')}
            </Pill>
            <h2 className="font-[family-name:var(--font-serif)] text-[var(--text-heading-sm)] font-light leading-[1.1] text-[var(--text)] md:text-[var(--text-heading)]">
              {t('feature.title')}
            </h2>
            <p className="max-w-[48ch] text-[var(--text-body-lg)] leading-[1.5] text-[var(--text-muted)]">
              {t('feature.body')}
            </p>
            <ul className="mt-[var(--spacing-8)] flex flex-col gap-[var(--spacing-12)]">
              {['feature.point1', 'feature.point2', 'feature.point3'].map((key) => (
                <li key={key} className="flex items-start gap-[var(--spacing-12)]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="mt-[2px] shrink-0"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span className="text-[var(--text-body)] text-[var(--text)]">{t(key)}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* floating glass preview card */}
          <Reveal delay={120}>
            <Card variant="glass" className="flex flex-col gap-[var(--spacing-16)]">
              <div className="flex items-center gap-[var(--spacing-8)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                <span className="text-[var(--text-caption)] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  {t('nav.announcement')}
                </span>
              </div>
              <div className="rounded-[var(--radius-images)] border border-[var(--hairline)] bg-[var(--surface-2)] px-[var(--spacing-16)] py-[var(--spacing-12)] text-[var(--text-muted)]">
                “young wizard at a magic school”
              </div>
              <div className="grid grid-cols-3 gap-[var(--spacing-12)]">
                {MOCK_BOOK_SUMMARIES.slice(1, 4).map((b) => (
                  <div
                    key={b.id}
                    className="overflow-hidden rounded-[var(--radius-images)] border border-[var(--hairline)]"
                  >
                    {b.coverImg && (
                      <img
                        src={b.coverImg}
                        alt=""
                        className="aspect-[2/3] w-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>
        </div>
      </Section>

      {/* ───────── Popular grid (surface) ───────── */}
      <Section band="surface" className="py-[var(--spacing-80)]">
        <Reveal className="flex flex-col items-center gap-[var(--spacing-8)] text-center">
          <h2 className="font-[family-name:var(--font-serif)] text-[var(--text-heading-sm)] font-normal text-[var(--text)] md:text-[var(--text-heading)]">
            {t('section.popular.title')}
          </h2>
          <p className="text-[var(--text-body)] text-[var(--text-muted)]">
            {t('section.popular.subtitle')}
          </p>
        </Reveal>

        <div className="mt-[var(--spacing-48)] grid grid-cols-2 gap-[var(--spacing-24)] sm:grid-cols-3 lg:grid-cols-4">
          {MOCK_BOOK_SUMMARIES.map((book, i) => (
            <BookCard key={book.id} book={book} index={i} />
          ))}
        </div>
      </Section>

      {/* ───────── CTA (sky) ───────── */}
      <Section band="sky" className="py-[var(--spacing-128)]">
        <Reveal>
          <Card
            variant="glass"
            className="flex flex-col items-center gap-[var(--spacing-16)] px-[var(--spacing-32)] py-[var(--spacing-64)] text-center"
          >
            <h2 className="max-w-[20ch] font-[family-name:var(--font-serif)] text-[var(--text-heading-sm)] font-light text-[var(--text)] md:text-[var(--text-heading)]">
              {t('cta.title')}
            </h2>
            <p className="max-w-[48ch] text-[var(--text-body-lg)] text-[var(--text-muted)]">
              {t('cta.body')}
            </p>
            <div className="mt-[var(--spacing-8)] flex flex-wrap items-center justify-center gap-[var(--spacing-12)]">
              <Button variant="accent" type="button" disabled title="Coming soon">
                {t('cta.button')}
              </Button>
              <Button variant="ghost" type="button" disabled title="Coming soon">
                {t('cta.secondary')}
              </Button>
            </div>
          </Card>
        </Reveal>
      </Section>
    </>
  );
}
