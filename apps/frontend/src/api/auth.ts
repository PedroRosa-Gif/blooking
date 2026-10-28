import { api } from '@/lib/axios';
import type { AuthResponse, User } from '@/types/api';

/**
 * Auth endpoints. These are the ONLY calls that read/write the refresh token in
 * the request body — everything else uses the access token via the interceptor.
 * When the HttpOnly-cookie migration lands, only this file and the interceptor
 * change.
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
 * Exchange a refresh token for a new access token (rotates the refresh token).
 * Marked `skipAuthRefresh` so a 401 here never re-enters the refresh interceptor.
 */
export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>(
    '/api/auth/refresh',
    { refreshToken },
    { skipAuthRefresh: true },
  );
  return data;
}

/** Revoke a refresh token. Best-effort: logout should succeed even if this fails. */
export async function logout(refreshToken: string | null): Promise<void> {
  if (!refreshToken) return;
  await api.post('/api/auth/logout', { refreshToken }, { skipAuthRefresh: true });
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/api/auth/me');
  return data;
}
