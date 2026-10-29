import type { ReactNode } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button } from './Button';

/** Centered message block for empty / error states. */
function Shell({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-line bg-card/40 px-6 py-16 text-center">
      {icon && <div className="text-fg-subtle">{icon}</div>}
      <h3 className="text-title font-semibold text-fg">{title}</h3>
      {body && <p className="max-w-md text-body-sm text-fg-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  icon,
  action,
}: {
  title: string;
  body?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return <Shell icon={icon} title={title} body={body} action={action} />;
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <Shell
      title={t('state.error.title')}
      body={getApiErrorMessage(error, t('state.error.body'))}
      action={
        onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            {t('state.retry')}
          </Button>
        ) : undefined
      }
    />
  );
}
