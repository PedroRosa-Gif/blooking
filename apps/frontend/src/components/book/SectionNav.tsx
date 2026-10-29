import { useI18n } from '@/i18n/I18nProvider';
import { useActiveSection } from '@/hooks/useActiveSection';
import { cn } from '@/lib/cn';

export interface NavSection {
  id: string;
  labelKey: string;
}

/**
 * Sticky in-page navigation for the book page. Highlights the section being
 * read and scrolls smoothly to a section on click. It sits just below the
 * 64px site header.
 */
export function SectionNav({ sections }: { sections: NavSection[] }) {
  const { t } = useI18n();
  const active = useActiveSection(
    sections.map((s) => s.id),
    140,
  );

  if (sections.length < 2) return null;

  function go(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = el.getBoundingClientRect().top + window.scrollY - 128;
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  }

  return (
    <nav
      aria-label={t('detail.sections')}
      className="sticky top-16 z-30 -mx-6 border-y border-line bg-nav/80 px-6 backdrop-blur-xl"
    >
      <ul className="no-scrollbar flex gap-1 overflow-x-auto py-2">
        {sections.map((s) => {
          const isActive = s.id === active;
          return (
            <li key={s.id} className="shrink-0">
              <button
                type="button"
                onClick={() => go(s.id)}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'rounded-full px-4 py-1.5 text-body-sm font-medium transition-colors',
                  isActive ? 'bg-fg/10 text-fg' : 'text-fg-muted hover:text-fg',
                )}
              >
                {t(s.labelKey)}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
