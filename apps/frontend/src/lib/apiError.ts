import axios from 'axios';
import type { ApiErrorBody } from '@/types/api';

/**
 * Normalizes any thrown value from an API call into a user-facing message,
 * tolerating all three error shapes the backend can emit:
 *  1. the custom GlobalExceptionHandler body `{ timestamp, status, error, message }`
 *  2. an empty 401 body from the security layer
 *  3. Spring's default error body `{ timestamp, status, error, path }` (no message)
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data as ApiErrorBody | undefined;

    if (body?.message) return body.message;
    if (status === 401) return 'You need to sign in to do that.';
    if (status === 403) return 'You do not have permission to do that.';
    if (status === 404) return 'Not found.';
    if (body?.error) return body.error;
    if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running?';
  }
  return fallback;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}
