import type { ReactNode } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { PillNav } from './PillNav';

/** Page shell: floating nav, centered max-width content, minimal footer. */
export function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="min-h-dvh bg-[var(--color-white-canvas)]">
      <PillNav />
      <main className="mx-auto w-full max-w-[1200px] px-[var(--spacing-24)] pb-[var(--spacing-80)] pt-[var(--spacing-40)]">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-[1200px] px-[var(--spacing-24)] pb-[var(--spacing-48)]">
        <div className="flex flex-col gap-[var(--spacing-4)] border-t border-[var(--color-ash-divider)] pt-[var(--spacing-24)] text-[var(--text-caption)] text-[var(--color-slate-helper)]">
          <span>{t('footer.tagline')}</span>
          <span>{t('footer.note')}</span>
        </div>
      </footer>
    </div>
  );
}
