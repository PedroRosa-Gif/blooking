import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import { backLabelKey, hasInAppHistory, originKind, readFromState } from '@/lib/navigation';
import { ChevronLeftIcon } from './Icon';

/**
 * "Back" that really goes back.
 *
 * When the user got here from inside the app, it steps back through history
 * (so the previous page, its filters and its scroll position all return) and
 * names that page: "Back to results", "Back to catalog", ... When the page was
 * opened directly (a shared link, a reload on the first entry) there is nothing
 * to go back to, so it offers the catalog instead.
 */
export function BackLink({ className }: { className?: string }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const { from } = readFromState(location.state);
  const canGoBack = hasInAppHistory(location.key);
  const classes = cn(
    'inline-flex items-center gap-1.5 text-body-sm text-fg-muted transition-colors hover:text-fg',
    className,
  );

  if (!canGoBack) {
    return (
      <Link to="/books" className={classes}>
        <ChevronLeftIcon />
        {t('back.browse')}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => navigate(-1)} className={classes}>
      <ChevronLeftIcon />
      {t(backLabelKey(originKind(from)))}
    </button>
  );
}
