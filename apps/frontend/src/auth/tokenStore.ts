/**
 * Token transport layer — deliberately isolated.
 *
 * PHASE 1 (current): the backend returns the refresh token in the JSON body and
 * expects it back in the request body. We keep the short-lived access token in
 * memory and persist the refresh token in localStorage.
 *
 * PLANNED MIGRATION: move the refresh token to an HttpOnly + Secure + SameSite
 * cookie (set/read by the backend) and add CSRF protection. When that lands,
 * only this module + the axios interceptor change — nothing else in the app
 * reads tokens directly. That is the whole point of funnelling token access
 * through here.
 */

const REFRESH_TOKEN_KEY = 'blooking.refreshToken';

/** Access token lives in memory only (never persisted) to limit XSS exposure. */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {
    /* storage unavailable (private mode, quota) — degrade gracefully */
  }
}

/** Clears both tokens (logout / auth failure). */
export function clearTokens(): void {
  setAccessToken(null);
  setRefreshToken(null);
}
