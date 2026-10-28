import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';

const INITIAL_VISIBLE = 12;

/**
 * A labelled row of pill chips, collapsed after the first dozen. Genre chips
 * link into the catalog filter.
 */
export function ChipRow({ items, linkGenre = false }: { items: string[]; linkGenre?: boolean }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  if (!items || items.length === 0) return null;

  const visible = expanded ? items : items.slice(0, INITIAL_VISIBLE);
  const hidden = items.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((item) =>
        linkGenre ? (
          <Link
            key={item}
            to={`/books?genre=${encodeURIComponent(item)}`}
            className="rounded-full border border-line px-3.5 py-1.5 text-body-sm text-fg-muted transition-colors hover:border-accent/40 hover:text-accent"
          >
            {item}
          </Link>
        ) : (
          <span
            key={item}
            className="rounded-full border border-line bg-card px-3.5 py-1.5 text-body-sm text-fg-muted"
          >
            {item}
          </span>
        ),
      )}
      {items.length > INITIAL_VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="rounded-full px-3 py-1.5 text-body-sm font-medium text-accent transition-colors hover:text-accent-hover"
        >
          {expanded ? t('chips.less') : t('chips.more', { count: hidden })}
        </button>
      )}
    </div>
  );
}
