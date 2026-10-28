import { useI18n } from '@/i18n/I18nProvider';
import { LANGUAGES, LANGUAGE_LABELS } from '@/i18n/translations';

/**
 * EN / PT toggle. Segmented pill matching the nav language — the designated
 * "section to add a language change" requested for the scaffold.
 */
export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t('nav.language')}
      className="inline-flex items-center rounded-[var(--radius-tags)] bg-[var(--color-mist-hairline)] p-[2px]"
    >
      {LANGUAGES.map((code) => {
        const active = code === lang;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => setLang(code)}
            className={[
              'rounded-[var(--radius-tags)] px-[var(--spacing-8)] py-[var(--spacing-4)] text-[var(--text-caption)] font-semibold tracking-[0.08em] transition-colors',
              active
                ? 'bg-[var(--color-white-canvas)] text-[var(--color-portrait-ink)] shadow-[var(--shadow-hairline)]'
                : 'text-[var(--color-slate-helper)] hover:text-[var(--color-portrait-ink)]',
            ].join(' ')}
          >
            {LANGUAGE_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
