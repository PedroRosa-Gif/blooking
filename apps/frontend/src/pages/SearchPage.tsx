import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { useSearch } from '@/api/hooks';
import { Section } from '@/components/layout/Section';
import { BookGrid } from '@/components/ui/BookGrid';
import { BookGridSkeleton } from '@/components/ui/BookCardSkeleton';
import { EmptyState, ErrorState } from '@/components/ui/StateView';
import { SearchIcon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

/** US01 — hybrid search results. The query lives in the URL (?q=). */
export function SearchPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get('q') ?? '';

  const [input, setInput] = useState(q);
  useEffect(() => setInput(q), [q]);

  const { data, isLoading, isFetching, isError, error, refetch } = useSearch(q);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search', { replace: true });
  }

  const results = data ?? [];

  return (
    <Section tone="sky" className="pb-28 pt-28">
      <header className="mb-10">
        <h1 className="text-4xl font-semibold tracking-[-0.035em] sm:text-headline">
          {t('search.title')}
        </h1>
        <form
          onSubmit={onSubmit}
          role="search"
          className="mt-6 flex h-14 w-full max-w-2xl items-center gap-2 rounded-full border border-line-strong bg-card pl-5 pr-2 focus-within:border-fg/60"
        >
          <SearchIcon size={20} className="shrink-0 text-fg-subtle" />
          <input
            type="search"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('hero.search.placeholder')}
            aria-label={t('hero.search.placeholder')}
            className="min-w-0 flex-1 bg-transparent text-body text-fg placeholder:text-fg-subtle focus:outline-none"
          />
          <Button type="submit" size="md">
            {t('hero.search.button')}
          </Button>
        </form>
      </header>

      {q.trim() === '' ? (
        <EmptyState
          icon={<SearchIcon size={28} />}
          title={t('search.prompt.title')}
          body={t('search.prompt.body')}
        />
      ) : isLoading || (isFetching && results.length === 0) ? (
        <BookGridSkeleton count={10} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<SearchIcon size={28} />}
          title={t('search.empty.title', { q })}
          body={t('search.empty.body')}
        />
      ) : (
        <>
          <p className="mb-6 font-mono text-caption text-fg-subtle">
            {t('search.count', { count: results.length, q })}
          </p>
          <BookGrid books={results} />
        </>
      )}
    </Section>
  );
}
