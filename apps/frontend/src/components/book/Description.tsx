import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { leadSentence, parseDescription, readingMinutes } from '@/lib/description';
import { cn } from '@/lib/cn';

/** Characters of body shown before "Read more" appears. */
const COLLAPSE_AT = 620;

/**
 * Readable description: the first sentence stands out as a lead, the rest is
 * broken into short paragraphs at a comfortable line length. Long descriptions
 * collapse behind "Read more". The edition note some entries start with
 * ("Librarian's note: …") is kept, but set apart and muted.
 */
export function Description({ text }: { text: string | null }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const parsed = useMemo(() => parseDescription(text), [text]);

  if (parsed.paragraphs.length === 0) {
    return <p className="text-body text-fg-muted">{t('detail.noDescription')}</p>;
  }

  const lead = leadSentence(parsed);
  const paragraphs = parsed.paragraphs.slice();
  // Show the lead once, big, and drop it from the first paragraph.
  if (lead && paragraphs[0]?.startsWith(lead)) {
    const rest = paragraphs[0].slice(lead.length).trim();
    if (rest) paragraphs[0] = rest;
    else paragraphs.shift();
  }

  const collapsible = parsed.length > COLLAPSE_AT;
  const showAll = expanded || !collapsible;
  const minutes = readingMinutes(parsed.length);

  return (
    <div className="flex flex-col gap-5">
      {lead && (
        <p className="max-w-[60ch] text-title font-medium leading-snug tracking-[-0.02em] text-fg">
          {lead}
        </p>
      )}

      <div
        className={cn(
          'relative max-w-[66ch] space-y-4 text-body-lg leading-relaxed text-fg/80',
          !showAll && 'clamp-fade max-h-44 overflow-hidden',
        )}
      >
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {collapsible && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="text-body-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            {expanded ? t('detail.readLess') : t('detail.readMore')}
          </button>
        )}
        <span className="font-mono text-caption text-fg-subtle">
          {t('detail.readingTime', { minutes })}
        </span>
      </div>

      {parsed.note && (
        <p className="max-w-[66ch] border-l-2 border-line pl-3 text-caption italic text-fg-subtle">
          {parsed.note}
        </p>
      )}
    </div>
  );
}
