/**
 * Token transport layer — deliberately isolated.
 *
 * The **refresh token** is an `HttpOnly` cookie owned entirely by the backend:
 * it is set/cleared via `Set-Cookie`, sent automatically on auth requests (the
 * axios client uses `withCredentials`), and is intentionally invisible to
 * JavaScript — so it cannot be read here, which is the whole point (an XSS
 * cannot exfiltrate it).
 *
 * This module therefore only holds the **access token**, in memory (never
 * persisted), to limit XSS exposure. Funnelling token access through here keeps
 * the rest of the app unaware of how tokens are transported.
 */

/** Access token lives in memory only (never persisted) to limit XSS exposure. */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Clears the in-memory access token (logout / auth failure). The refresh
 *  cookie is cleared server-side by the logout endpoint. */
export function clearTokens(): void {
  setAccessToken(null);
}
