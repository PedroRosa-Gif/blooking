import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import { HeartIcon, SparkleIcon } from '@/components/ui/Icon';

/** Avatar initial from the display name or username. */
function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

/**
 * Signed-in user menu: an avatar button that opens a popover with the user's
 * name, links to Favorites and Recommendations, and Log out. Closes on outside
 * click, Escape, or navigation.
 */
export function UserMenu() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const name = user?.displayName?.trim() || user?.username || '';

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function onLogout() {
    setOpen(false);
    await logout();
    navigate('/');
  }

  const itemClass =
    'flex items-center gap-3 rounded-xl px-3 py-2 text-body-sm text-fg-muted transition-colors hover:bg-fg/5 hover:text-fg';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('nav.account')}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-line pl-1 pr-3 transition-colors hover:border-line-strong"
      >
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-accent font-mono text-caption font-semibold text-accent-ink">
          {initialOf(name)}
        </span>
        <span className="max-w-[10rem] truncate text-body-sm font-medium text-fg">{name}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-2xl border border-line bg-nav p-2 shadow-cover"
        >
          <div className="px-3 py-2">
            <p className="truncate text-body-sm font-semibold text-fg">{name}</p>
            {user?.displayName?.trim() && (
              <p className="truncate text-caption text-fg-subtle">@{user.username}</p>
            )}
          </div>
          <div className="my-1 h-px bg-line" />
          <Link
            to="/favorites"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <HeartIcon />
            {t('nav.favorites')}
          </Link>
          <Link
            to="/recommendations"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <SparkleIcon />
            {t('nav.recommendations')}
          </Link>
          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            className={cn(itemClass, 'w-full')}
          >
            {t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
