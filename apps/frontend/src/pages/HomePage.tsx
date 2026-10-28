import { useMemo, useState, type FormEvent } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import type { BookSummary } from '@/types/api';
import { MOCK_BOOK_SUMMARIES } from '@/mocks/books';
import { buildShelves } from '@/lib/shelves';
import { Section } from '@/components/layout/Section';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Reveal } from '@/components/ui/Reveal';
import { Tag } from '@/components/ui/Tag';
import { BookShelf } from '@/components/ui/BookShelf';
import { BookOpenIcon, GlobeIcon, HeartIcon, SearchIcon } from '@/components/ui/Icon';

const STATS = ['books', 'lang', 'dim', 'rrf'] as const;
const CHIPS = ['hero.chip1', 'hero.chip2', 'hero.chip3'] as const;

const iconBadge =
  'inline-flex size-10 items-center justify-center rounded-xl border border-line bg-fg/5 text-fg';
const h2Class = 'text-4xl font-semibold sm:text-headline';

/**
 * Home. Bands, top to bottom:
 *   Hero (sky) > Genre shelves (solid) > How it works (sky) >
 *   Why Blooking, bento (solid) > CTA (sky)
 * Sample data for now; Phase 2 swaps in the live API.
 */
export function HomePage() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');

  const shelves = useMemo(() => buildShelves(MOCK_BOOK_SUMMARIES), []);
  const previewBooks = useMemo(
    () =>
      [2, 8, 9]
        .map((id) => MOCK_BOOK_SUMMARIES.find((b) => b.id === id))
        .filter((b): b is BookSummary => Boolean(b)),
    [],
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Phase 2 wires this to /api/search and a results route.
  }

  return (
    <>
      {/* ───────── Hero (sky) ───────── */}
      <Section tone="sky" className="pb-24 pt-20 sm:pt-28">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <Reveal>
            <Tag tone="accent">{t('hero.eyebrow')}</Tag>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="mt-6 text-balance text-5xl font-semibold tracking-[-0.045em] sm:text-6xl lg:text-display">
              {t('hero.title.pre')} <span className="text-accent">{t('hero.title.accent')}</span>{' '}
              {t('hero.title.post')}
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mx-auto mt-6 max-w-xl text-lead text-fg-muted">{t('hero.subtitle')}</p>
          </Reveal>

          <Reveal delay={180} className="w-full">
            <form
              onSubmit={onSubmit}
              role="search"
              className="mx-auto mt-10 flex h-14 w-full max-w-2xl items-center gap-2 rounded-full border border-line-strong bg-card/70 pl-5 pr-2 shadow-cover backdrop-blur-xl transition-colors focus-within:border-fg/60"
            >
              <SearchIcon size={20} className="shrink-0 text-fg-subtle" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('hero.search.placeholder')}
                aria-label={t('hero.search.placeholder')}
                className="min-w-0 flex-1 bg-transparent text-body text-fg placeholder:text-fg-subtle focus:outline-none"
              />
              <Button type="submit" size="md">
                {t('hero.search.button')}
              </Button>
            </form>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="font-mono text-caption uppercase tracking-wider text-fg-subtle">
                {t('hero.search.try')}
              </span>
              {CHIPS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setQuery(t(key))}
                  className="rounded-full border border-line px-3 py-1.5 text-caption text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Stats strip (design_v3 trust strip, as facts about the product) */}
        <Reveal delay={300} className="mt-20">
          <ul className="grid grid-cols-2 gap-y-8 border-y border-line py-8 md:grid-cols-4">
            {STATS.map((key, i) => (
              <li
                key={key}
                className={`px-4 text-center md:px-8 ${i > 0 ? 'md:border-l md:border-line' : ''}`}
              >
                <p className="font-mono text-title font-medium text-fg">
                  {t(`stats.${key}.value`)}
                </p>
                <p className="mt-1 text-caption text-fg-muted">{t(`stats.${key}.label`)}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      {/* ───────── Genre shelves (solid) ───────── */}
      <Section tone="solid" id="genres" className="py-28">
        <Reveal className="max-w-2xl">
          <Tag>{t('shelves.eyebrow')}</Tag>
          <h2 className={`mt-4 ${h2Class}`}>{t('shelves.title')}</h2>
          <p className="mt-4 text-lead text-fg-muted">{t('shelves.subtitle')}</p>
        </Reveal>

        <div className="mt-14 flex flex-col gap-14">
          {shelves.map(({ def, books }) => (
            <Reveal key={def.id}>
              <BookShelf
                id={`shelf-${def.id}`}
                title={t(`shelf.${def.id}.title`)}
                subtitle={t(`shelf.${def.id}.subtitle`)}
                books={books}
              />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ───────── How it works (sky) ───────── */}
      <Section tone="sky" id="how" className="py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Tag>{t('how.eyebrow')}</Tag>
          <h2 className={`mt-4 text-balance ${h2Class}`}>{t('how.title')}</h2>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            { n: 1, icon: <SearchIcon size={20} /> },
            { n: 2, icon: <BookOpenIcon size={20} /> },
            { n: 3, icon: <HeartIcon size={20} /> },
          ].map(({ n, icon }, i) => (
            <Reveal key={n} delay={i * 90}>
              <Card variant="glass" className="flex h-full flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className={iconBadge}>{icon}</span>
                  <span className="font-mono text-caption text-fg-subtle">0{n}</span>
                </div>
                <h3 className="text-lead font-semibold text-fg">{t(`how.step${n}.title`)}</h3>
                <p className="text-body-sm text-fg-muted">{t(`how.step${n}.body`)}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ───────── Why Blooking: bento (solid) ───────── */}
      <Section tone="solid" id="why" className="py-28">
        <Reveal className="max-w-2xl">
          <Tag tone="accent">{t('why.eyebrow')}</Tag>
          <h2 className={`mt-4 text-balance ${h2Class}`}>{t('why.title')}</h2>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-6">
          {/* Tile 1: hybrid search preview */}
          <Reveal className="md:col-span-4">
            <Card className="flex h-full flex-col gap-6">
              <div>
                <h3 className="text-lead font-semibold text-fg">{t('why.tile1.title')}</h3>
                <p className="mt-2 max-w-xl text-body-sm text-fg-muted">{t('why.tile1.body')}</p>
              </div>
              <div className="rounded-xl border border-line bg-nav/60 p-4">
                <div className="flex items-center gap-2 border-b border-line pb-3 font-mono text-body-sm text-fg">
                  <SearchIcon className="shrink-0 text-fg-subtle" />
                  <span className="truncate">{t('why.tile1.query')}</span>
                </div>
                <ul>
                  {previewBooks.map((b, i) => (
                    <li
                      key={b.id}
                      className="flex items-center gap-3 border-b border-line py-3 last:border-b-0 last:pb-0"
                    >
                      <span className="w-5 font-mono text-caption text-fg-subtle">0{i + 1}</span>
                      {b.coverImg && (
                        <img
                          src={b.coverImg}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="aspect-[2/3] w-8 shrink-0 rounded object-cover ring-1 ring-line"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-body-sm font-medium text-fg">{b.title}</p>
                        <p className="truncate text-caption text-fg-muted">{b.author}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </Reveal>

          {/* Tile 2: multilingual */}
          <Reveal delay={90} className="md:col-span-2">
            <Card className="flex h-full flex-col gap-4">
              <span className={iconBadge}>
                <GlobeIcon size={20} />
              </span>
              <h3 className="text-lead font-semibold text-fg">{t('why.tile2.title')}</h3>
              <p className="text-body-sm text-fg-muted">{t('why.tile2.body')}</p>
              <div className="mt-auto flex gap-2">
                <Tag>EN</Tag>
                <Tag>PT</Tag>
              </div>
            </Card>
          </Reveal>

          {/* Tile 3: learns your taste */}
          <Reveal className="md:col-span-2">
            <Card className="flex h-full flex-col gap-4">
              <span className={iconBadge}>
                <HeartIcon size={20} />
              </span>
              <h3 className="text-lead font-semibold text-fg">{t('why.tile3.title')}</h3>
              <p className="text-body-sm text-fg-muted">{t('why.tile3.body')}</p>
            </Card>
          </Reveal>

          {/* Tile 4: one command (design_v3 recessed code field) */}
          <Reveal delay={90} className="md:col-span-4">
            <Card className="flex h-full flex-col gap-4">
              <h3 className="text-lead font-semibold text-fg">{t('why.tile4.title')}</h3>
              <p className="max-w-xl text-body-sm text-fg-muted">{t('why.tile4.body')}</p>
              <div className="mt-auto rounded-xl border border-line bg-nav/60 px-4 py-3 font-mono text-body-sm text-fg-muted">
                <span className="select-none text-fg-subtle">$ </span>
                docker compose up -d
              </div>
            </Card>
          </Reveal>
        </div>
      </Section>

      {/* ───────── CTA (sky) ───────── */}
      <Section tone="sky" className="py-32">
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className={`text-balance ${h2Class}`}>{t('cta.title')}</h2>
          <p className="mt-4 text-lead text-fg-muted">{t('cta.body')}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" type="button" title={t('common.soon')}>
              {t('cta.button')}
            </Button>
            <Button size="lg" variant="outline" type="button" title={t('common.soon')}>
              {t('cta.secondary')}
            </Button>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
