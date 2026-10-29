/**
 * Client-side mirror of the backend's auth validation (RegisterRequest /
 * LoginRequest). Returns an i18n key for the first problem, or null if valid,
 * so the form can show a message before hitting the network. The backend still
 * validates; this is just a faster, friendlier first pass.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 50;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 100;
export const DISPLAY_NAME_MAX = 100;

export function validateUsername(value: string): string | null {
  const v = value.trim();
  if (v.length === 0) return 'auth.error.usernameRequired';
  if (v.length < USERNAME_MIN || v.length > USERNAME_MAX) return 'auth.error.usernameLength';
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length === 0) return 'auth.error.passwordRequired';
  if (value.length < PASSWORD_MIN || value.length > PASSWORD_MAX)
    return 'auth.error.passwordLength';
  return null;
}

export function validateDisplayName(value: string): string | null {
  if (value.trim().length > DISPLAY_NAME_MAX) return 'auth.error.displayNameLength';
  return null;
}

/** For login: username/password just need to be present (no length rules). */
export function validateLoginUsername(value: string): string | null {
  return value.trim().length === 0 ? 'auth.error.usernameRequired' : null;
}

export function validateLoginPassword(value: string): string | null {
  return value.length === 0 ? 'auth.error.passwordRequired' : null;
}
