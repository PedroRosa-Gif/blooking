import type { ReactNode } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { SkyCanvas } from '@/components/visual/SkyCanvas';
import { AnnouncementBar } from './AnnouncementBar';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

/**
 * Page shell: fixed night sky behind everything, an announcement strip that
 * scrolls away, a sticky header, edge-to-edge sections, and the footer.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="relative min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-body-sm focus:font-medium focus:text-accent-ink"
      >
        {t('a11y.skip')}
      </a>
      <SkyCanvas />
      <AnnouncementBar />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
