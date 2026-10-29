import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nProvider';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/apiError';
import {
  PASSWORD_MIN,
  USERNAME_MIN,
  validateDisplayName,
  validatePassword,
  validateUsername,
} from '@/lib/authValidation';
import { safeRedirect } from '@/lib/navigation';
import { Section } from '@/components/layout/Section';
import { AuthCard } from '@/components/auth/AuthCard';
import { Field } from '@/components/auth/Field';
import { Button } from '@/components/ui/Button';

/** US06 — create an account. Signs the user in and redirects on success. */
export function RegisterPage() {
  const { t } = useI18n();
  const { register, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const from = safeRedirect(params.get('from'));

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace state={location.state} />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const u = validateUsername(username);
    const p = validatePassword(password);
    const d = validateDisplayName(displayName);
    setErrors({ username: u ?? undefined, password: p ?? undefined, displayName: d ?? undefined });
    setFormError(null);
    if (u || p || d) return;

    setSubmitting(true);
    try {
      await register({ username: username.trim(), password, displayName });
      navigate(from, { replace: true });
    } catch (err) {
      if (getApiErrorStatus(err) === 409) {
        setErrors((prev) => ({ ...prev, username: t('auth.error.usernameTaken') }));
      } else {
        setFormError(getApiErrorMessage(err, t('auth.error.generic')));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const loginHref = from === '/' ? '/login' : `/login?from=${encodeURIComponent(from)}`;

  return (
    <Section tone="sky" className="pt-20">
      <AuthCard
        title={t('auth.register.title')}
        subtitle={t('auth.register.subtitle')}
        footer={
          <>
            {t('auth.register.haveAccount')}{' '}
            <Link to={loginHref} className="font-medium text-accent hover:text-accent-hover">
              {t('auth.register.toLogin')}
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
            hint={t('auth.hint.username', { min: USERNAME_MIN })}
          />
          <Field
            label={t('auth.password')}
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password ? t(errors.password) : null}
            hint={t('auth.hint.password', { min: PASSWORD_MIN })}
          />
          <Field
            label={t('auth.displayName')}
            name="displayName"
            autoComplete="nickname"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={errors.displayName ? t(errors.displayName) : null}
            hint={t('auth.hint.displayName')}
          />
          <Button type="submit" size="lg" disabled={submitting} className="mt-1 w-full">
            {submitting ? t('auth.register.submitting') : t('auth.register.submit')}
          </Button>
        </form>
      </AuthCard>
    </Section>
  );
}
