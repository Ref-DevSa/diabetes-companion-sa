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
  | 'link_expired'
  | 'reading_future'
  | 'reading_too_old'
  | 'daily_limit'
  | 'not_found'
  | 'custom_item_limit'
  | 'item_name_taken'
  | 'session_ended';

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
  reading_future: 'errors.readingFuture',
  reading_too_old: 'errors.readingTooOld',
  daily_limit: 'errors.dailyLimit',
  not_found: 'diary.gone',
  custom_item_limit: 'errors.customItemLimit',
  item_name_taken: 'errors.itemNameTaken',
  session_ended: 'errors.sessionEnded',
};

/** True when the browser already knows it has no internet (BR23). */
export function isOfflineNow(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/**
 * True when a Supabase call failed because the network could not be reached (no answer at all).
 * Supabase Auth also uses AuthRetryableFetchError for server answers such as 500 or 504; those are
 * server errors ("Something went wrong on our side"), not "offline".
 */
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const { name, message, status } = error as { name?: string; message?: string; status?: number };
  if (typeof status === 'number' && status >= 400) return false;
  if (name === 'AuthRetryableFetchError') return true;
  if (status === 0) return true;
  return /failed to fetch|fetch failed|networkerror|load failed|network request failed/i.test(message ?? '');
}

// ---------------------------------------------------------------- session ended (PRD 6.2, edge cases 3 and 9)
const sessionEndedListeners = new Set<() => void>();

/** AuthProvider listens here: when a save shows the account is gone, it signs the person out. */
export function onSessionEnded(listener: () => void): () => void {
  sessionEndedListeners.add(listener);
  return () => {
    sessionEndedListeners.delete(listener);
  };
}

type DatabaseError = { code?: string; message?: string; name?: string; status?: number };

/**
 * True when the database refused a request because the account behind the session no longer exists
 * (deleted on another phone: the owner link fails) or the login token was rejected.
 */
function isSessionGone(error: DatabaseError): boolean {
  if (error.code === 'PGRST301' || error.code === 'PGRST303') return true;
  return error.code === '23503' && /_user_id_fkey/.test(error.message ?? '');
}

/**
 * One place that turns a database error into the PRD message code (Phase 8 Step 3):
 * no network → offline; account gone → session_ended (and the session is ended);
 * a rule of the calling screen → its own code; anything else → server.
 */
export function databaseErrorCode(error: DatabaseError, specific?: (error: DatabaseError) => ErrorCode | undefined): ErrorCode {
  if (isNetworkError(error)) return 'offline';
  if (isSessionGone(error)) {
    for (const listener of sessionEndedListeners) listener();
    return 'session_ended';
  }
  return specific?.(error) ?? 'server';
}

/** True when Supabase Auth says the signed-in account or its session no longer exists (not for network or server faults). */
export function isAccountGone(error: unknown): boolean {
  if (!error || typeof error !== 'object' || isNetworkError(error)) return false;
  const { status, code } = error as { status?: number; code?: string };
  if (code === 'user_not_found' || code === 'session_not_found' || code === 'bad_jwt') return true;
  return status === 401 || status === 403;
}
