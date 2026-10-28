import { useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { useBook } from '@/api/hooks';
import { getApiErrorStatus } from '@/lib/apiError';
import { displayAuthors } from '@/lib/authors';
import { bookSections } from '@/lib/bookSections';
import { Section } from '@/components/layout/Section';
import { BackLink } from '@/components/ui/BackLink';
import { buttonClasses } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/StateView';
import { AwardsSection } from '@/components/book/AwardsSection';
import { FavoriteButton } from '@/components/book/FavoriteButton';
import { ChipRow } from '@/components/book/ChipRow';
import { ConstellationFacts } from '@/components/book/ConstellationFacts';
import { Description } from '@/components/book/Description';
import {
  MoreByAuthor,
  MoreInGenre,
  hasEnough,
  useMoreByAuthor,
  useMoreInGenre,
} from '@/components/book/RelatedShelves';
import { SectionNav } from '@/components/book/SectionNav';
import type { BookDetail } from '@/types/api';

/** A titled block of the page, addressable by the section nav. */
function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32">
      <h2 className="font-mono text-caption uppercase tracking-wider text-fg-subtle">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** US04 — book detail. Nocturnal "constellation" layout with in-page navigation. */
export function BookDetailPage() {
  const { t } = useI18n();
  const { id } = useParams();
  const numericId = Number(id);
  const { data: book, isLoading, isError, error, refetch } = useBook(numericId);

  if (!Number.isFinite(numericId) || numericId <= 0) {
    return (
      <Section tone="sky" className="py-32">
        <NotFound />
      </Section>
    );
  }

  if (isLoading) {
    return (
      <Section tone="sky" className="flex min-h-[60vh] items-center justify-center py-32">
        <Spinner size={28} />
      </Section>
    );
  }

  if (isError || !book) {
    const status = getApiErrorStatus(error);
    return (
      <Section tone="sky" className="py-32">
        {status === 404 ? <NotFound /> : <ErrorState error={error} onRetry={() => refetch()} />}
      </Section>
    );
  }

  return <BookContent key={book.id} book={book} />;
}

function BookContent({ book }: { book: BookDetail }) {
  const { t } = useI18n();
  const location = useLocation();
  const [coverFailed, setCoverFailed] = useState(false);

  const byAuthor = useMoreByAuthor(book);
  const inGenre = useMoreInGenre(book);
  const sections = bookSections(book, {
    hasMoreByAuthor: hasEnough(byAuthor),
    hasMoreInGenre: Boolean(inGenre.genre) && hasEnough(inGenre.books),
  });

  const showCover = Boolean(book.coverImg) && !coverFailed;
  const credits = displayAuthors(book.author);

  return (
    <Section tone="sky" className="pb-28 pt-24">
      <BackLink />

      {/* Hero: glowing cover + title block */}
      <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,260px)_1fr] md:gap-14">
        <div className="relative mx-auto w-48 shrink-0 sm:w-56 md:mx-0 md:w-full">
          <div
            aria-hidden="true"
            className="absolute -inset-6 -z-10 rounded-full opacity-70 blur-2xl"
            style={{
              background:
                'radial-gradient(60% 60% at 50% 40%, color-mix(in srgb, var(--accent) 30%, transparent), transparent 70%)',
            }}
          />
          <div className="overflow-hidden rounded-image bg-card-2 shadow-cover ring-1 ring-line">
            {showCover ? (
              <img
                src={book.coverImg ?? undefined}
                alt={`${book.title} cover`}
                referrerPolicy="no-referrer"
                onError={() => setCoverFailed(true)}
                className="aspect-[2/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center p-6 text-center text-body font-medium text-fg-muted">
                {book.title}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          {book.series && (
            <p className="font-mono text-caption uppercase tracking-wider text-accent">
              {book.series}
            </p>
          )}
          <h1 className="mt-2 text-balance text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            {book.title}
          </h1>
          {credits && (
            <p className="mt-3 text-lead text-fg-muted">
              {t('detail.by')} <span className="text-fg">{credits}</span>
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <FavoriteButton bookId={book.id} />
            <Link
              to="/books"
              state={{ from: `${location.pathname}${location.search}` }}
              className={buttonClasses({ variant: 'outline' })}
            >
              {t('detail.browse')}
            </Link>
          </div>

          <div className="mt-10 border-t border-line pt-8">
            <ConstellationFacts book={book} />
          </div>
        </div>
      </div>

      {/* In-page navigation */}
      <div className="mt-14">
        <SectionNav sections={sections} />
      </div>

      <div className="mt-12 flex flex-col gap-16">
        <Block id="about" title={t('detail.about')}>
          <Description text={book.description} />
          {book.genres.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 font-mono text-caption uppercase tracking-wider text-fg-subtle">
                {t('detail.genres')}
              </h3>
              <ChipRow items={book.genres} linkGenre />
            </div>
          )}
        </Block>

        {book.awards.length > 0 && (
          <Block id="awards" title={t('detail.awards')}>
            <AwardsSection awards={book.awards} />
          </Block>
        )}

        {book.characters.length > 0 && (
          <Block id="characters" title={t('detail.characters')}>
            <ChipRow items={book.characters} />
          </Block>
        )}

        <MoreByAuthor book={book} />
        <MoreInGenre book={book} />
      </div>
    </Section>
  );
}

function NotFound() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <p className="font-mono text-title text-accent">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">
        {t('detail.notFound.title')}
      </h1>
      <p className="mt-3 text-lead text-fg-muted">{t('detail.notFound.body')}</p>
      <Link to="/books" className={buttonClasses({ size: 'lg', className: 'mt-8' })}>
        {t('detail.notFound.cta')}
      </Link>
    </div>
  );
}
