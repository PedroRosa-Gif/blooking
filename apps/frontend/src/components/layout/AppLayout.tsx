import type { ReactNode } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { Starfield } from '@/components/visual/Starfield';
import { PillNav } from './PillNav';

/**
 * Page shell. The night-sky gradient + starfield is a fixed, full-bleed canvas
 * behind everything (design_v2's "painting is the connective tissue" idea,
 * reinterpreted as a nocturnal sky). Content and nav float on top.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="relative min-h-dvh">
      {/* Fixed sky canvas */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10"
        style={{ background: 'var(--sky-gradient)' }}
      >
        <Starfield count={160} />
      </div>

      <PillNav />

      <main className="mx-auto w-full max-w-[1200px] px-[var(--spacing-24)] pb-[var(--spacing-80)] pt-[var(--spacing-40)]">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-[1200px] px-[var(--spacing-24)] pb-[var(--spacing-48)]">
        <div className="flex flex-col gap-[var(--spacing-4)] border-t border-[var(--hairline)] pt-[var(--spacing-24)] text-[var(--text-body-sm)] text-[var(--text-muted)]">
          <span>{t('footer.tagline')}</span>
          <span>{t('footer.note')}</span>
        </div>
      </footer>
    </div>
  );
}
