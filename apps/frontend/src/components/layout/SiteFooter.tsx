import { useI18n } from '@/i18n/I18nProvider';
import { BrandMark } from '@/components/ui/BrandMark';

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="relative border-t border-[var(--hairline)] bg-[color-mix(in_srgb,var(--bg-elevated)_90%,transparent)] backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--spacing-16)] px-[var(--spacing-24)] py-[var(--spacing-48)]">
        <BrandMark label={t('nav.brand')} />
        <p className="max-w-[460px] text-[var(--text-body-sm)] text-[var(--text-muted)]">
          {t('footer.tagline')}
        </p>
        <p className="text-[var(--text-caption)] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          {t('footer.note')}
        </p>
      </div>
    </footer>
  );
}
