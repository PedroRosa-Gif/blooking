import { api } from '@/lib/axios';
import type { AuthResponse, User } from '@/types/api';

/**
 * Auth endpoints. The refresh token is an HttpOnly cookie handled by the
 * backend (sent automatically via `withCredentials`), so these calls never
 * touch it directly; everything else uses the access token via the interceptor.
 */

export interface RegisterInput {
  username: string;
  password: string;
  displayName?: string;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/register', {
    username: input.username,
    password: input.password,
    // Omit an empty displayName so the backend stores null, not "".
    displayName: input.displayName?.trim() ? input.displayName.trim() : undefined,
  });
  return data;
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/login', { username, password });
  return data;
}

/**
 * Exchange the refresh-token cookie for a new access token (rotates the cookie
 * server-side). The refresh token is sent automatically as an HttpOnly cookie
 * (`withCredentials`), so there is no request body. Marked `skipAuthRefresh` so
 * a 401 here never re-enters the refresh interceptor.
 */
export async function refresh(): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/refresh', null, {
    skipAuthRefresh: true,
  });
  return data;
}

/**
 * Revoke the refresh token and clear its cookie (server-side). The cookie is
 * sent automatically; best-effort — logout should succeed even if this fails.
 */
export async function logout(): Promise<void> {
  await api.post('/api/auth/logout', null, { skipAuthRefresh: true });
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/api/auth/me');
  return data;
}
