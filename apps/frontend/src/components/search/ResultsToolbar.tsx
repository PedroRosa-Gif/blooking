import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import { SORT_KEYS, type Refinement, type SortKey } from '@/lib/refine';
import { CloseIcon } from '@/components/ui/Icon';

export type ViewMode = 'grid' | 'list';

/** Sort select + grid/list switch. */
export function ResultsToolbar({
  sort,
  onSort,
  view,
  onView,
}: {
  sort: SortKey;
  onSort: (s: SortKey) => void;
  view: ViewMode;
  onView: (v: ViewMode) => void;
}) {
  const { t } = useI18n();
  const seg = (active: boolean) =>
    cn(
      'inline-flex size-8 items-center justify-center rounded-full transition-colors',
      active ? 'bg-fg/10 text-fg' : 'text-fg-subtle hover:text-fg',
    );

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 text-body-sm text-fg-muted">
        <span className="hidden sm:inline">{t('catalog.sort')}</span>
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
          className="h-9 rounded-full border border-line bg-card px-3 text-body-sm text-fg focus:border-fg/50 focus:outline-none"
        >
          {SORT_KEYS.map((k) => (
            <option key={k} value={k}>
              {t(`searchSort.${k}`)}
            </option>
          ))}
        </select>
      </label>

      <div
        role="group"
        aria-label={t('search.view')}
        className="inline-flex items-center rounded-full border border-line p-0.5"
      >
        <button
          type="button"
          aria-pressed={view === 'grid'}
          aria-label={t('search.view.grid')}
          title={t('search.view.grid')}
          onClick={() => onView('grid')}
          className={seg(view === 'grid')}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
            <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
            <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
            <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
          </svg>
        </button>
        <button
          type="button"
          aria-pressed={view === 'list'}
          aria-label={t('search.view.list')}
          title={t('search.view.list')}
          onClick={() => onView('list')}
          className={seg(view === 'list')}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M8 6h12M8 12h12M8 18h12" />
            <circle cx="4" cy="6" r="0.75" fill="currentColor" />
            <circle cx="4" cy="12" r="0.75" fill="currentColor" />
            <circle cx="4" cy="18" r="0.75" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/** Removable chips for every applied filter. */
export function ActiveFilters({
  value,
  onChange,
}: {
  value: Refinement;
  onChange: (next: Refinement) => void;
}) {
  const { t } = useI18n();
  const chips: Array<{ key: string; label: string; remove: () => void }> = [
    ...value.genres.map((g) => ({
      key: `g-${g}`,
      label: g,
      remove: () => onChange({ ...value, genres: value.genres.filter((x) => x !== g) }),
    })),
    ...value.decades.map((d) => ({
      key: `d-${d}`,
      label: `${d}s`,
      remove: () => onChange({ ...value, decades: value.decades.filter((x) => x !== d) }),
    })),
    ...(value.minRating > 0
      ? [
          {
            key: 'r',
            label: t('refine.rating.min', { n: value.minRating.toFixed(1) }),
            remove: () => onChange({ ...value, minRating: 0 }),
          },
        ]
      : []),
  ];

  if (chips.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label={t('refine.active')}>
      {chips.map((c) => (
        <li key={c.key}>
          <button
            type="button"
            onClick={c.remove}
            aria-label={t('refine.remove', { label: c.label })}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 py-1 pl-3 pr-2 text-body-sm text-accent transition-colors hover:bg-accent/20"
          >
            {c.label}
            <CloseIcon size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
}
