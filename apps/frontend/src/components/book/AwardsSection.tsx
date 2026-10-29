import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { organizeAwards, type ParsedAward } from '@/lib/awards';
import { cn } from '@/lib/cn';

const INITIAL_VISIBLE = 6;

function AwardRow({ award }: { award: ParsedAward }) {
  const { t } = useI18n();
  return (
    <li className="grid grid-cols-[3.25rem_1fr] items-baseline gap-x-4 border-b border-line py-3 last:border-b-0">
      <span className="font-mono text-caption text-fg-subtle">{award.year ?? '—'}</span>
      <div className="min-w-0">
        <p className="text-body-sm font-medium text-fg">{award.name}</p>
        {(award.category || award.detail) && (
          <p className="mt-0.5 text-caption text-fg-muted">
            {[award.category, award.detail && t(`awards.detail.${award.detail.toLowerCase()}`)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>
    </li>
  );
}

function Group({
  title,
  count,
  awards,
  tone,
}: {
  title: string;
  count: number;
  awards: ParsedAward[];
  tone: 'won' | 'nominated';
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? awards : awards.slice(0, INITIAL_VISIBLE);
  const hidden = awards.length - visible.length;

  if (awards.length === 0) return null;

  return (
    <div className="rounded-card border border-line bg-card/60 p-5">
      <div className="flex items-center justify-between gap-3">
        <h4
          className={cn(
            'flex items-center gap-2 font-mono text-caption uppercase tracking-wider',
            tone === 'won' ? 'text-accent' : 'text-fg-subtle',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'size-1.5 rounded-full',
              tone === 'won' ? 'bg-accent shadow-[0_0_8px_var(--accent)]' : 'bg-fg/40',
            )}
          />
          {title}
        </h4>
        <span className="font-mono text-caption text-fg-subtle">{count}</span>
      </div>

      <ul className="mt-2">
        {visible.map((a, i) => (
          <AwardRow key={`${a.raw}-${i}`} award={a} />
        ))}
      </ul>

      {awards.length > INITIAL_VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 text-body-sm font-medium text-fg-muted transition-colors hover:text-fg"
        >
          {expanded ? t('awards.showLess') : t('awards.showMore', { count: hidden })}
        </button>
      )}
    </div>
  );
}

/**
 * Awards grouped into "Won" and "Nominated", newest first, each group collapsed
 * to the first few rows. A book can have 40+ entries, so the list never
 * dominates the page.
 */
export function AwardsSection({ awards }: { awards: string[] }) {
  const { t } = useI18n();
  const organized = useMemo(() => organizeAwards(awards), [awards]);
  const { summary } = organized;

  if (summary.total === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-caption text-fg-subtle">
        {summary.won > 0 && (
          <span>
            <span className="text-fg">{summary.won}</span> {t('awards.won')}
          </span>
        )}
        {summary.nominated > 0 && (
          <span>
            <span className="text-fg">{summary.nominated}</span> {t('awards.nominated')}
          </span>
        )}
        {summary.firstYear != null && summary.lastYear != null && (
          <span>
            {summary.firstYear === summary.lastYear
              ? summary.firstYear
              : `${summary.firstYear}–${summary.lastYear}`}
          </span>
        )}
      </p>

      <div
        className={cn('grid gap-4', summary.won > 0 && summary.nominated > 0 && 'lg:grid-cols-2')}
      >
        <Group title={t('awards.won')} count={summary.won} awards={organized.won} tone="won" />
        <Group
          title={t('awards.nominated')}
          count={summary.nominated}
          awards={organized.nominated}
          tone="nominated"
        />
      </div>
    </div>
  );
}
