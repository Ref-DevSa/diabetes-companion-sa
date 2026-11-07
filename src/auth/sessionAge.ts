/**
 * PRD Section 5 "Stay logged in: 30 days, then the User must log in again".
 * Supabase's own session-length setting needs a paid plan, so the app checks the last
 * sign-in time itself (Section 10 session rule; Section 18, question 16).
 */
export const SESSION_MAX_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isSessionTooOld(lastSignInAt: string | undefined, now: number = Date.now()): boolean {
  if (!lastSignInAt) return false;
  const signedInAt = Date.parse(lastSignInAt);
  if (Number.isNaN(signedInAt)) return false;
  return now - signedInAt > SESSION_MAX_DAYS * DAY_MS;
}
