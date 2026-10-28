import type { ReactNode } from 'react';
import { SkyCanvas } from '@/components/visual/SkyCanvas';
import { PillNav } from './PillNav';
import { SiteFooter } from './SiteFooter';

/**
 * Page shell. The night-sky canvas is fixed behind everything; the nav floats
 * on top. Sections manage their own full-bleed (sky) vs. contained (surface)
 * layout, so `<main>` is edge-to-edge here (design_v2: the sky is full-bleed,
 * copy blocks are centered within each section).
 */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <SkyCanvas />
      <PillNav />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
