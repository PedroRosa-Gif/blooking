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
import { clearTokens, getRefreshToken, setAccessToken, setRefreshToken } from './tokenStore';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** True while bootstrapping the session from a stored refresh token on first load. */
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

  // Apply an AuthResponse: store tokens, then fetch the user profile.
  const applyAuth = useRef(async (auth: AuthResponse) => {
    setAccessToken(auth.accessToken);
    setRefreshToken(auth.refreshToken);
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
      refresh: async () => {
        const token = getRefreshToken();
        if (!token) return null;
        try {
          const auth = await authApi.refresh(token);
          setAccessToken(auth.accessToken);
          setRefreshToken(auth.refreshToken);
          return auth.accessToken;
        } catch {
          return null;
        }
      },
      onExpired: () => clearSession.current(),
    });
  }, []);

  // Bootstrap: if a refresh token survived a reload, restore the session.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = getRefreshToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const auth = await authApi.refresh(token);
        if (cancelled) return;
        setAccessToken(auth.accessToken);
        setRefreshToken(auth.refreshToken);
        const me = await authApi.getMe();
        if (!cancelled) setUser(me);
      } catch {
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
        const token = getRefreshToken();
        try {
          await authApi.logout(token);
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
