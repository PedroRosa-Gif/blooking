import { useI18n } from '@/i18n/I18nProvider';
import { LANGUAGES, LANGUAGE_LABELS } from '@/i18n/translations';

/** EN / PT segmented toggle. */
export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t('nav.language')}
      className="inline-flex items-center rounded-[var(--radius-tags)] border border-[var(--hairline)] bg-[var(--surface)] p-[2px]"
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
                ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]',
            ].join(' ')}
          >
            {LANGUAGE_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
