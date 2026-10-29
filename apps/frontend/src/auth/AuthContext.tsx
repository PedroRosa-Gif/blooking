import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthResponse, User } from '@/types/api';
import * as authApi from '@/api/auth';
import { configureAuthRefresh } from '@/lib/axios';
import { clearTokens, setAccessToken } from './tokenStore';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** True while bootstrapping the session from the refresh cookie on first load. */
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (input: authApi.RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Apply an AuthResponse: store the access token (the refresh token is an
  // HttpOnly cookie set by the backend), then fetch the user profile.
  const applyAuth = useRef(async (auth: AuthResponse) => {
    setAccessToken(auth.accessToken);
    const me = await authApi.getMe();
    setUser(me);
  });

  const clearSession = useRef(() => {
    clearTokens();
    setUser(null);
    queryClient.clear(); // drop any per-user cached data (favorites, recommendations)
  });

  // Keep the latest clearSession reachable from the interceptor config.
  useEffect(() => {
    configureAuthRefresh({
      // The refresh token is the HttpOnly cookie — sent automatically. We just
      // try the refresh; success means the cookie was valid.
      refresh: async () => {
        try {
          const auth = await authApi.refresh();
          setAccessToken(auth.accessToken);
          return auth.accessToken;
        } catch {
          return null;
        }
      },
      onExpired: () => clearSession.current(),
    });
  }, []);

  // Bootstrap: try to restore a session from the refresh cookie (if any) on
  // first load. There is nothing to read client-side — if the cookie is present
  // and valid, the refresh succeeds; otherwise we stay logged out.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const auth = await authApi.refresh();
        if (cancelled) return;
        setAccessToken(auth.accessToken);
        const me = await authApi.getMe();
        if (!cancelled) setUser(me);
      } catch {
        // No valid refresh cookie (logged out / expired): start anonymous.
        if (!cancelled) clearSession.current();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login: async (username, password) => {
        const auth = await authApi.login(username, password);
        await applyAuth.current(auth);
      },
      register: async (input) => {
        const auth = await authApi.register(input);
        await applyAuth.current(auth);
      },
      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          clearSession.current();
        }
      },
    }),
    [user, isLoading],
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
