/**
 * Error codes returned by the data functions (Section 10) and the exact PRD text for each
 * (as i18n keys in src/i18n/en.json). Nothing here ever contains a password, email or reading.
 */
export type ErrorCode =
  | 'offline'
  | 'server'
  | 'invalid_email'
  | 'email_taken'
  | 'weak_password'
  | 'wrong_credentials'
  | 'too_many_tries'
  | 'unconfirmed'
  | 'link_expired';

export type Result<T = void> = { ok: true; data: T } | { ok: false; code: ErrorCode };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T = void>(code: ErrorCode): Result<T> {
  return { ok: false, code };
}

export const errorMessageKey: Record<ErrorCode, string> = {
  offline: 'errors.offline',
  server: 'errors.server',
  invalid_email: 'errors.invalidEmail',
  email_taken: 'errors.emailTaken',
  weak_password: 'errors.weakPassword',
  wrong_credentials: 'errors.wrongCredentials',
  too_many_tries: 'errors.tooManyTries',
  unconfirmed: 'errors.unconfirmed',
  link_expired: 'errors.linkExpired',
};

/** True when the browser already knows it has no internet (BR23). */
export function isOfflineNow(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/** True when a Supabase call failed because the network could not be reached. */
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const { name, message, status } = error as { name?: string; message?: string; status?: number };
  if (name === 'AuthRetryableFetchError') return true;
  if (status === 0) return true;
  return /failed to fetch|fetch failed|networkerror|load failed|network request failed/i.test(message ?? '');
}
