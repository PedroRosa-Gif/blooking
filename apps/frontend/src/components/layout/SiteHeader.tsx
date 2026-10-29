import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/auth/AuthContext';
import { BrandMark } from '@/components/ui/BrandMark';
import { Button, buttonClasses } from '@/components/ui/Button';
import { CloseIcon, HeartIcon, MenuIcon, SearchIcon, SparkleIcon } from '@/components/ui/Icon';
import { useSearchShortcut } from '@/hooks/useSearchShortcut';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

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
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  // "/" jumps to search from anywhere (except while typing in a field).
  useSearchShortcut(() => navigate('/search'));

  // Carry the current location to the auth pages so they can return here.
  const authFrom = `${location.pathname}${location.search}`;
  const loginHref = authFrom === '/' ? '/login' : `/login?from=${encodeURIComponent(authFrom)}`;
  const registerHref =
    authFrom === '/' ? '/register' : `/register?from=${encodeURIComponent(authFrom)}`;
  const userName = user?.displayName?.trim() || user?.username || '';

  async function onMobileLogout() {
    setOpen(false);
    await logout();
    navigate('/');
  }

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
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-6 px-6 desk:grid desk:grid-cols-[1fr_auto_1fr]">
        <Link to="/" aria-label={t('nav.home')} className="justify-self-start">
          <BrandMark label={t('nav.brand')} />
        </Link>

        <nav aria-label={t('nav.primary')} className="hidden items-center gap-1 desk:flex">
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

        <div className="hidden items-center justify-self-end gap-2 desk:flex">
          <Link
            to="/search"
            aria-label={t('nav.search')}
            className="group inline-flex h-9 items-center gap-2 rounded-full border border-line pl-3.5 pr-2 text-body-sm text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            <SearchIcon />
            <span>{t('nav.search')}</span>
            <kbd className="rounded-md border border-line px-1.5 py-0.5 font-mono text-caption text-fg-subtle">
              /
            </kbd>
          </Link>
          <LanguageSwitcher />
          <ThemeToggle />
          <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <Link to={loginHref} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                {t('nav.login')}
              </Link>
              <Link to={registerHref} className={buttonClasses({ size: 'sm' })}>
                {t('nav.signup')}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
          className="inline-flex size-9 items-center justify-center rounded-full border border-line text-fg transition-colors hover:border-line-strong desk:hidden"
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-nav desk:hidden">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-6">
            <Link
              to="/search"
              onClick={() => setOpen(false)}
              className="flex h-12 items-center gap-3 rounded-full border border-line px-5 text-body text-fg-muted"
            >
              <SearchIcon size={20} />
              {t('nav.search')}
            </Link>
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
            {isAuthenticated && (
              <nav className="flex flex-col">
                <Link
                  to="/favorites"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 border-b border-line py-3 text-lead font-medium text-fg"
                >
                  <HeartIcon size={20} />
                  {t('nav.favorites')}
                </Link>
                <Link
                  to="/recommendations"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 border-b border-line py-3 text-lead font-medium text-fg"
                >
                  <SparkleIcon size={20} />
                  {t('nav.recommendations')}
                </Link>
              </nav>
            )}
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            {isAuthenticated ? (
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-body-sm text-fg-muted">{userName}</span>
                <Button variant="outline" type="button" onClick={onMobileLogout}>
                  {t('nav.logout')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to={loginHref}
                  onClick={() => setOpen(false)}
                  className={buttonClasses({ variant: 'outline', className: 'flex-1' })}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to={registerHref}
                  onClick={() => setOpen(false)}
                  className={buttonClasses({ className: 'flex-1' })}
                >
                  {t('nav.signup')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
