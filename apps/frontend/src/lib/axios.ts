import axios, { AxiosHeaders } from 'axios';
import { getAccessToken } from '@/auth/tokenStore';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

/**
 * Shared Axios instance for the Blooking API.
 *
 * `withCredentials` is enabled now (the backend already sets
 * `allowCredentials=true`) so that the planned HttpOnly refresh-token cookie
 * flow works without another wiring change later.
 */
export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
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
 * PHASE 3 (auth): a response interceptor will catch 401s on protected calls,
 * attempt a single `POST /api/auth/refresh` (rotating the refresh token), and
 * replay the original request. Left out in the scaffold phase on purpose —
 * there are no authenticated calls yet.
 */
