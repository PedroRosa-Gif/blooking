import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Section } from '@/components/layout/Section';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Gate for authenticated-only routes. While the session is still bootstrapping
 * (a stored refresh token being exchanged on load) it shows a spinner, so a
 * logged-in user who reloads a protected page is not bounced to login. Once
 * resolved, anonymous users are sent to /login with a `from` to return to.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Section tone="sky" className="flex min-h-[60vh] items-center justify-center py-32">
        <Spinner size={28} />
      </Section>
    );
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
  }

  return <>{children}</>;
}
