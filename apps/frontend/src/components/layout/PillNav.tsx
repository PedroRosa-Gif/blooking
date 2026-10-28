import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { BrandMark } from '@/components/ui/BrandMark';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

/**
 * Floating sticky pill nav. Semi-transparent over the night sky with a blur so
 * the starfield shows through faintly. Brand mark (owl + magnifier) left,
 * product announcement center, controls + auth actions right. Auth routes
 * arrive in Phase 3, so Login/Sign up are inert for now.
 */
export function PillNav() {
  const { t } = useI18n();

  return (
    <div className="sticky top-[var(--spacing-16)] z-50 flex justify-center px-[var(--spacing-16)]">
      <nav className="flex w-full max-w-[1120px] items-center justify-between gap-[var(--spacing-16)] rounded-[var(--radius-nav)] border border-[var(--hairline)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] px-[var(--spacing-20)] py-[var(--spacing-12)] shadow-[var(--shadow-float)] backdrop-blur-md">
        <Link to="/" aria-label={t('nav.brand')}>
          <BrandMark label={t('nav.brand')} />
        </Link>

        <div className="hidden items-center gap-[var(--spacing-8)] lg:flex">
          <Pill tone="accent" uppercase>
            New
          </Pill>
          <span className="text-[var(--text-body-sm)] text-[var(--text-muted)]">
            {t('nav.announcement')}
          </span>
        </div>

        <div className="flex items-center gap-[var(--spacing-8)]">
          <ThemeToggle />
          <LanguageSwitcher />
          <span className="hidden sm:inline">
            <Button variant="ghost" type="button" disabled title="Coming soon">
              {t('nav.login')}
            </Button>
          </span>
          <Button variant="accent" type="button" disabled title="Coming soon">
            {t('nav.signup')}
          </Button>
        </div>
      </nav>
    </div>
  );
}
