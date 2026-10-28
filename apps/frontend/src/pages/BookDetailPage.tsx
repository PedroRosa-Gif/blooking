import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { useBook } from '@/api/hooks';
import { getApiErrorStatus } from '@/lib/apiError';
import { Section } from '@/components/layout/Section';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/StateView';
import { ArrowRightIcon, ChevronLeftIcon, HeartIcon } from '@/components/ui/Icon';
import { ConstellationFacts } from '@/components/book/ConstellationFacts';
import { ChipRow } from '@/components/book/ChipRow';

/** US04 — book detail. Nocturnal "constellation" layout. */
export function BookDetailPage() {
  const { t } = useI18n();
  const { id } = useParams();
  const numericId = Number(id);
  const { data: book, isLoading, isError, error, refetch } = useBook(numericId);

  const [coverFailed, setCoverFailed] = useState(false);

  if (!Number.isFinite(numericId) || numericId <= 0) {
    return (
      <Section tone="sky" className="py-32">
        <NotFound t={t} />
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
        {status === 404 ? (
          <NotFound t={t} />
        ) : (
          <ErrorState error={error} onRetry={() => refetch()} />
        )}
      </Section>
    );
  }

  const showCover = Boolean(book.coverImg) && !coverFailed;

  return (
    <Section tone="sky" className="pb-28 pt-24">
      <Link
        to="/books"
        className="inline-flex items-center gap-1.5 text-body-sm text-fg-muted transition-colors hover:text-fg"
      >
        <ChevronLeftIcon />
        {t('detail.back')}
      </Link>

      {/* Hero: glowing cover + title block */}
      <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,260px)_1fr] md:gap-14">
        <div className="relative mx-auto w-48 shrink-0 sm:w-56 md:mx-0 md:w-full">
          {/* amber aura behind the cover */}
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
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            {book.title}
          </h1>
          {book.author && (
            <p className="mt-3 text-lead text-fg-muted">
              {t('detail.by')} <span className="text-fg">{book.author}</span>
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="button" title={t('common.soon')} className="gap-2">
              <HeartIcon />
              {t('detail.favorite')}
            </Button>
            <Link
              to="/books"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-5 text-body-sm font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              {t('detail.more')}
              <ArrowRightIcon />
            </Link>
          </div>

          {/* Constellation of facts */}
          <div className="mt-10 border-t border-line pt-8">
            <ConstellationFacts book={book} />
          </div>
        </div>
      </div>

      {/* Description */}
      {book.description && (
        <div className="mt-16 max-w-3xl">
          <h2 className="font-mono text-caption uppercase tracking-wider text-fg-subtle">
            {t('detail.about')}
          </h2>
          <p className="mt-4 whitespace-pre-line text-body-lg leading-relaxed text-fg/90">
            {book.description}
          </p>
        </div>
      )}

      {/* Chip rows */}
      <div className="mt-14 flex flex-col gap-10">
        <ChipRow label={t('detail.genres')} items={book.genres} linkGenre />
        <ChipRow label={t('detail.characters')} items={book.characters} />
        <ChipRow label={t('detail.awards')} items={book.awards} />
      </div>
    </Section>
  );
}

function NotFound({ t }: { t: ReturnType<typeof useI18n>['t'] }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <p className="font-mono text-title text-accent">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">
        {t('detail.notFound.title')}
      </h1>
      <p className="mt-3 text-lead text-fg-muted">{t('detail.notFound.body')}</p>
      <Link
        to="/books"
        className="mt-8 inline-flex h-11 items-center rounded-full bg-accent px-6 text-body-sm font-medium text-accent-ink"
      >
        {t('detail.notFound.cta')}
      </Link>
    </div>
  );
}
