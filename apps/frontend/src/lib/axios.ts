import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken } from '@/auth/tokenStore';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Do not run the 401 refresh interceptor for this request (used by /refresh, /logout). */
    skipAuthRefresh?: boolean;
    /** Internal: set once a request has already been retried after a refresh. */
    _retried?: boolean;
  }
}

/**
 * Shared Axios instance for the Blooking API.
 *
 * `withCredentials` is enabled (the backend sets `allowCredentials=true`) so the
 * planned HttpOnly refresh-token cookie flow works without rewiring later.
 */
export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  // Serialize array params as repeated keys (`genre=a&genre=b`) rather than
  // axios's default bracketed form (`genre[]=a`), which is what Spring's
  // `@RequestParam List<String>` binding expects.
  paramsSerializer: { indexes: null },
});

// Attach the in-memory access token to every request when present.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

/*
 * 401 handling with single-flight refresh.
 *
 * When a protected call gets 401, we try ONE `/api/auth/refresh`. Concurrent
 * 401s share that single refresh (they wait on `refreshPromise`) instead of
 * each firing their own — the backend rotates the refresh token, so parallel
 * refreshes would invalidate each other. After it resolves, the original
 * requests are replayed once with the new access token.
 *
 * The actual refresh + session-clearing logic lives in AuthContext; it
 * registers callbacks here via `configureAuthRefresh` so this module stays free
 * of React and of the token transport details.
 */
let doRefresh: (() => Promise<string | null>) | null = null;
let onSessionExpired: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function configureAuthRefresh(opts: {
  refresh: () => Promise<string | null>;
  onExpired: () => void;
}) {
  doRefresh = opts.refresh;
  onSessionExpired = opts.onExpired;
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.response || !error.config) {
      return Promise.reject(error);
    }
    const status = error.response.status;
    const config = error.config as InternalAxiosRequestConfig;

    const canRetry =
      status === 401 && doRefresh !== null && !config.skipAuthRefresh && !config._retried;
    if (!canRetry) {
      return Promise.reject(error);
    }

    config._retried = true;
    try {
      // Share one in-flight refresh across all concurrent 401s.
      refreshPromise = refreshPromise ?? doRefresh!();
      const newToken = await refreshPromise;
      refreshPromise = null;

      if (!newToken) {
        onSessionExpired?.();
        return Promise.reject(error);
      }
      const headers = AxiosHeaders.from(config.headers);
      headers.set('Authorization', `Bearer ${newToken}`);
      config.headers = headers;
      return api(config);
    } catch (refreshError) {
      refreshPromise = null;
      onSessionExpired?.();
      return Promise.reject(refreshError);
    }
  },
);
