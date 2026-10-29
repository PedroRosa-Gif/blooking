import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nProvider';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/apiError';
import { validateLoginPassword, validateLoginUsername } from '@/lib/authValidation';
import { safeRedirect } from '@/lib/navigation';
import { Section } from '@/components/layout/Section';
import { AuthCard } from '@/components/auth/AuthCard';
import { Field } from '@/components/auth/Field';
import { Button } from '@/components/ui/Button';

/** US07 — log in. Redirects back to `?from=` (validated) or home on success. */
export function LoginPage() {
  const { t } = useI18n();
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const from = safeRedirect(params.get('from'));

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in (e.g. navigated here by hand): bounce to the target.
  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace state={location.state} />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const u = validateLoginUsername(username);
    const p = validateLoginPassword(password);
    setErrors({ username: u ?? undefined, password: p ?? undefined });
    setFormError(null);
    if (u || p) return;

    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(
        getApiErrorStatus(err) === 401
          ? t('auth.error.invalidCredentials')
          : getApiErrorMessage(err, t('auth.error.generic')),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const registerHref = from === '/' ? '/register' : `/register?from=${encodeURIComponent(from)}`;

  return (
    <Section tone="sky" className="pt-20">
      <AuthCard
        title={t('auth.login.title')}
        subtitle={t('auth.login.subtitle')}
        footer={
          <>
            {t('auth.login.noAccount')}{' '}
            <Link to={registerHref} className="font-medium text-accent hover:text-accent-hover">
              {t('auth.login.toRegister')}
            </Link>
          </>
        }
      >
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          {formError && (
            <p
              role="alert"
              className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-body-sm text-danger"
            >
              {formError}
            </p>
          )}
          <Field
            label={t('auth.username')}
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={errors.username ? t(errors.username) : null}
          />
          <Field
            label={t('auth.password')}
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password ? t(errors.password) : null}
          />
          <Button type="submit" size="lg" disabled={submitting} className="mt-1 w-full">
            {submitting ? t('auth.login.submitting') : t('auth.login.submit')}
          </Button>
        </form>
      </AuthCard>
    </Section>
  );
}
