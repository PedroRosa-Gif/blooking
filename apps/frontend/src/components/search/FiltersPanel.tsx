import { useMemo, useState, type ReactNode } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import {
  RATING_STEPS,
  activeCount,
  decadeFacets,
  genreFacets,
  toggle,
  usefulFacets,
  type Refinement,
} from '@/lib/refine';
import type { BookSummary } from '@/types/api';

const GENRES_COLLAPSED = 8;

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-5 first:border-t-0 first:pt-0">
      <legend className="mb-3 font-mono text-caption uppercase tracking-wider text-fg-subtle">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Option({
  checked,
  onChange,
  label,
  count,
  type = 'checkbox',
  name,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
  type?: 'checkbox' | 'radio';
  name?: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-body-sm transition-colors hover:bg-fg/5',
        checked ? 'text-fg' : 'text-fg-muted',
      )}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="size-4 shrink-0 accent-[var(--accent)]"
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count != null && <span className="font-mono text-caption text-fg-subtle">{count}</span>}
    </label>
  );
}

/**
 * Refinement controls for search results: genre (any of), decade, minimum
 * rating. Counts are computed from the current results, with the other groups
 * applied, and facets that cannot narrow anything are hidden.
 */
export function FiltersPanel({
  books,
  total,
  value,
  onChange,
}: {
  /** The full, unfiltered result set (facets are computed from this). */
  books: BookSummary[];
  /** Number of results in `books`. */
  total: number;
  value: Refinement;
  onChange: (next: Refinement) => void;
}) {
  const { t } = useI18n();
  const [showAllGenres, setShowAllGenres] = useState(false);

  const genres = useMemo(
    () => usefulFacets(genreFacets(books, value, 60), total, value.genres),
    [books, value, total],
  );
  const decades = useMemo(
    () => usefulFacets(decadeFacets(books, value), total, value.decades),
    [books, value, total],
  );

  const shownGenres = showAllGenres ? genres : genres.slice(0, GENRES_COLLAPSED);
  const hiddenGenres = genres.length - shownGenres.length;
  const n = activeCount(value);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-body font-semibold text-fg">
          {t('refine.title')}
          {n > 0 && (
            <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 font-mono text-caption text-accent">
              {n}
            </span>
          )}
        </h2>
        {n > 0 && (
          <button
            type="button"
            onClick={() => onChange({ ...value, genres: [], decades: [], minRating: 0 })}
            className="text-body-sm text-fg-muted transition-colors hover:text-fg"
          >
            {t('refine.clear')}
          </button>
        )}
      </div>

      {genres.length > 0 && (
        <Group title={t('refine.genre')}>
          <div className="flex flex-col">
            {shownGenres.map((f) => (
              <Option
                key={f.value}
                checked={value.genres.includes(f.value)}
                onChange={() => onChange({ ...value, genres: toggle(value.genres, f.value) })}
                label={f.value}
                count={f.count}
              />
            ))}
          </div>
          {genres.length > GENRES_COLLAPSED && (
            <button
              type="button"
              onClick={() => setShowAllGenres((v) => !v)}
              aria-expanded={showAllGenres}
              className="mt-2 px-2 text-body-sm font-medium text-accent transition-colors hover:text-accent-hover"
            >
              {showAllGenres ? t('refine.fewer') : t('refine.more', { count: hiddenGenres })}
            </button>
          )}
        </Group>
      )}

      {decades.length > 0 && (
        <Group title={t('refine.decade')}>
          <div className="flex flex-col">
            {decades.map((f) => (
              <Option
                key={f.value}
                checked={value.decades.includes(f.value)}
                onChange={() => onChange({ ...value, decades: toggle(value.decades, f.value) })}
                label={`${f.value}s`}
                count={f.count}
              />
            ))}
          </div>
        </Group>
      )}

      <Group title={t('refine.rating')}>
        <div className="flex flex-col">
          {RATING_STEPS.map((step) => (
            <Option
              key={step}
              type="radio"
              name="min-rating"
              checked={value.minRating === step}
              onChange={() => onChange({ ...value, minRating: step })}
              label={
                step === 0 ? t('refine.rating.any') : t('refine.rating.min', { n: step.toFixed(1) })
              }
            />
          ))}
        </div>
      </Group>
    </div>
  );
}
