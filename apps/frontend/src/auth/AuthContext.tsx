import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@/types/api';
import { clearTokens } from './tokenStore';

/**
 * Auth context — SKELETON for Phase 1.
 *
 * The shape is the stable public surface the rest of the app will consume
 * (login/register/logout + current user). The actual network wiring (calling
 * `/api/auth/*`, token rotation, bootstrapping the session from a stored
 * refresh token) is implemented in Phase 3. Keeping this interface fixed now
 * means feature components can be written against it without churn later.
 */
export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** True while bootstrapping the session on first load (Phase 3). */
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading: false,
      logout: () => {
        clearTokens();
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
