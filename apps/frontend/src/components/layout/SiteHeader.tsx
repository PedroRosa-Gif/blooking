import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { BrandMark } from '@/components/ui/BrandMark';
import { Button } from '@/components/ui/Button';
import { CloseIcon, MenuIcon } from '@/components/ui/Icon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

// `to` is a router route; `href` is a homepage hash anchor (browser-handled).
const NAV_LINKS: Array<{ key: string; to?: string; href?: string }> = [
  { key: 'nav.browse', to: '/books' },
  { key: 'nav.how', href: '/#how' },
  { key: 'nav.why', href: '/#why' },
];

const linkClass =
  'rounded-full px-3 py-2 text-body-sm font-medium text-fg-muted transition-colors hover:text-fg';

/**
 * Sticky console-style header (design_v3): a bar darker than the page with a
 * hairline underneath. Three aligned groups on desktop (brand, links, actions);
 * a disclosure menu below 1024px. Every control is 36px tall, icons are 16px.
 *
 * Anchor links use plain <a href="/#id"> so the browser handles the hash scroll
 * (React Router's <Link> does not scroll to hashes).
 * Login / Sign up are wired up in the auth phase.
 */
export function SiteHeader() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-nav/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-6 px-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <Link to="/" aria-label={t('nav.home')} className="justify-self-start">
          <BrandMark label={t('nav.brand')} />
        </Link>

        <nav aria-label={t('nav.primary')} className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) =>
            l.to ? (
              <Link key={l.key} to={l.to} className={linkClass}>
                {t(l.key)}
              </Link>
            ) : (
              <a key={l.key} href={l.href} className={linkClass}>
                {t(l.key)}
              </a>
            ),
          )}
        </nav>

        <div className="hidden items-center justify-self-end gap-2 lg:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
          <Button variant="ghost" size="sm" type="button" title={t('common.soon')}>
            {t('nav.login')}
          </Button>
          <Button size="sm" type="button" title={t('common.soon')}>
            {t('nav.signup')}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
          className="inline-flex size-9 items-center justify-center rounded-full border border-line text-fg transition-colors hover:border-line-strong lg:hidden"
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-nav lg:hidden">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-6">
            <nav aria-label={t('nav.primary')} className="flex flex-col">
              {NAV_LINKS.map((l) => {
                const cls = 'border-b border-line py-3 text-lead font-medium text-fg';
                return l.to ? (
                  <Link key={l.key} to={l.to} onClick={() => setOpen(false)} className={cls}>
                    {t(l.key)}
                  </Link>
                ) : (
                  <a key={l.key} href={l.href} onClick={() => setOpen(false)} className={cls}>
                    {t(l.key)}
                  </a>
                );
              })}
            </nav>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" type="button" className="flex-1" title={t('common.soon')}>
                {t('nav.login')}
              </Button>
              <Button type="button" className="flex-1" title={t('common.soon')}>
                {t('nav.signup')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
