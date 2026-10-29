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
 * HttpOnly refresh-token cookie and the CSRF cookie are sent on cross-origin
 * requests. A request interceptor attaches the access-token Bearer header and
 * the `X-XSRF-TOKEN` CSRF header (from the `XSRF-TOKEN` cookie) on mutating calls.
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

/** Methods that mutate state and therefore require a CSRF token. */
const CSRF_METHODS = new Set(['post', 'put', 'patch', 'delete']);

/** Reads a cookie value by name (returns null if absent). */
function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

// Attach the in-memory access token, and the CSRF token on mutating requests.
api.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);

  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Double-submit CSRF: echo the backend's JS-readable XSRF-TOKEN cookie in the
  // X-XSRF-TOKEN header on state-changing requests. GETs don't need it, and the
  // backend exempts login/register (no ambient cookie yet) — harmless to send.
  if (CSRF_METHODS.has((config.method ?? 'get').toLowerCase())) {
    const csrf = readCookie('XSRF-TOKEN');
    if (csrf) {
      headers.set('X-XSRF-TOKEN', csrf);
    }
  }

  config.headers = headers;
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
