import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { BrandMark } from '@/components/ui/BrandMark';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { LanguageSwitcher } from './LanguageSwitcher';

/**
 * Floating sticky pill navigation.
 *
 * Adapted from the design's "Floating Pill Nav" to the Blooking domain: brand
 * mark + a product announcement pill (hybrid search) in the center, and
 * language switch + Login (ghost) + Sign up (rainbow CTA) on the right.
 * Auth routes don't exist yet (Phase 3) so those actions are inert for now.
 */
export function PillNav() {
  const { t } = useI18n();

  return (
    <div className="sticky top-[var(--spacing-16)] z-50 flex justify-center px-[var(--spacing-16)]">
      <nav className="flex w-full max-w-[1120px] items-center justify-between gap-[var(--spacing-16)] rounded-[var(--radius-nav)] bg-[var(--color-white-canvas)] px-[var(--spacing-20)] py-[var(--spacing-12)] shadow-[var(--shadow-float)]">
        <Link to="/" aria-label={t('nav.brand')}>
          <BrandMark label={t('nav.brand')} />
        </Link>

        <div className="hidden items-center gap-[var(--spacing-8)] md:flex">
          <Pill tone="sky" uppercase>
            New
          </Pill>
          <span className="text-[var(--text-caption)] text-[var(--color-slate-helper)]">
            {t('nav.announcement')}
          </span>
        </div>

        <div className="flex items-center gap-[var(--spacing-12)]">
          <LanguageSwitcher />
          <span className="hidden sm:inline">
            <Button variant="ghost" type="button" disabled title="Coming soon">
              {t('nav.login')}
            </Button>
          </span>
          <Button variant="rainbow" type="button" disabled title="Coming soon">
            {t('nav.signup')}
          </Button>
        </div>
      </nav>
    </div>
  );
}
