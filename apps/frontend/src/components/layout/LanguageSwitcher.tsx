import { useI18n } from '@/i18n/I18nProvider';
import { LANGUAGES, LANGUAGE_LABELS } from '@/i18n/translations';
import { cn } from '@/lib/cn';

/** EN / PT segmented control, 36px tall like every other header control. */
export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t('nav.language')}
      className="inline-flex h-9 items-center rounded-full border border-line p-0.5"
    >
      {LANGUAGES.map((code) => {
        const active = code === lang;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => setLang(code)}
            className={cn(
              'h-full rounded-full px-3 font-mono text-caption font-medium transition-colors',
              active ? 'bg-fg/10 text-fg' : 'text-fg-subtle hover:text-fg',
            )}
          >
            {LANGUAGE_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
