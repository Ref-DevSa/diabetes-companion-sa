// Account operations OP1 to OP7 (IMPLEMENTATION_PLAN.md Section 10).
// Each takes an optional client so integration tests can act as different people.
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import { fail, isNetworkError, isOfflineNow, ok, type Result } from '../lib/errors';
import { PRIVACY_NOTICE_VERSION } from '../lib/privacyNotice';

/** Where an email link should bring the person back to in this app (undefined outside a browser). */
function appUrl(path: string): string | undefined {
  return typeof window === 'undefined' ? undefined : `${window.location.origin}${path}`;
}

function errorCode(error: unknown): string {
  return (error as { code?: string } | null)?.code ?? '';
}

/**
 * OP1: create an account. S2 calls this only after both boxes are ticked (BR18); the database
 * refuses an account without the consent metadata (handle_new_user).
 */
export async function signUp(
  details: { email: string; password: string },
  client: SupabaseClient = getSupabase(),
): Promise<Result> {
  if (isOfflineNow()) return fail('offline');
  const { data, error } = await client.auth.signUp({
    email: details.email.trim(),
    password: details.password,
    options: {
      emailRedirectTo: appUrl('/log-in'),
      data: { age_confirmed: 'true', privacy_agreed: 'true', privacy_notice_version: PRIVACY_NOTICE_VERSION },
    },
  });
  if (error) {
    if (isNetworkError(error)) return fail('offline');
    const code = errorCode(error);
    if (code === 'weak_password') return fail('weak_password');
    if (code === 'email_address_invalid' || code === 'validation_failed') return fail('invalid_email');
    if (code === 'user_already_exists' || code === 'email_exists') return fail('email_taken');
    return fail('server');
  }
  // With email confirmation on, Supabase answers a taken email with a user that has no identities.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return fail('email_taken');
  }
  return ok(undefined);
}

/** OP2: send the confirmation email again. */
export async function resendConfirmation(email: string, client: SupabaseClient = getSupabase()): Promise<Result> {
  if (isOfflineNow()) return fail('offline');
  const { error } = await client.auth.resend({
    type: 'signup',
    email: email.trim(),
    options: { emailRedirectTo: appUrl('/log-in') },
  });
  if (error) return fail(isNetworkError(error) ? 'offline' : 'server');
  return ok(undefined);
}

/** OP3: false after 5 failed log-ins for this email in the last 15 minutes. */
export async function isLoginAllowed(email: string, client: SupabaseClient = getSupabase()): Promise<boolean> {
  const { data, error } = await client.rpc('check_login_allowed', { p_email: email.trim() });
  if (error) return true;
  return data !== false;
}

/** OP4: log in, with the 5-tries rule (PRD Section 5). */
export async function logIn(email: string, password: string, client: SupabaseClient = getSupabase()): Promise<Result> {
  if (isOfflineNow()) return fail('offline');
  const cleanEmail = email.trim();

  const allowed = await client.rpc('check_login_allowed', { p_email: cleanEmail });
  if (allowed.error && isNetworkError(allowed.error)) return fail('offline');
  if (allowed.data === false) return fail('too_many_tries');

  const { error } = await client.auth.signInWithPassword({ email: cleanEmail, password });
  if (error) {
    if (isNetworkError(error)) return fail('offline');
    const code = errorCode(error);
    if (code === 'email_not_confirmed') return fail('unconfirmed');
    if (code === 'invalid_credentials') {
      await client.rpc('record_failed_login', { p_email: cleanEmail });
      return fail('wrong_credentials');
    }
    if (code === 'over_request_rate_limit') return fail('too_many_tries');
    return fail('server');
  }

  await client.rpc('clear_my_login_attempts');
  return ok(undefined);
}

/** OP5: always answers the same way, whether or not the email is registered (PRD 4.5). */
export async function requestPasswordReset(
  email: string,
  client: SupabaseClient = getSupabase(),
  redirectTo: string | undefined = appUrl('/forgot-password'),
): Promise<Result> {
  if (isOfflineNow()) return fail('offline');
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error && isNetworkError(error)) return fail('offline');
  if (error && errorCode(error) !== 'over_email_send_rate_limit') return fail('server');
  return ok(undefined);
}

/** OP6: saves the new password with the recovery session from the email link, then signs out. */
export async function saveNewPassword(password: string, client: SupabaseClient = getSupabase()): Promise<Result> {
  if (isOfflineNow()) return fail('offline');
  const { data } = await client.auth.getSession();
  if (!data.session) return fail('link_expired');
  const { error } = await client.auth.updateUser({ password });
  if (error) {
    if (isNetworkError(error)) return fail('offline');
    const code = errorCode(error);
    if (code === 'weak_password' || code === 'same_password') return fail('weak_password');
    if (code === 'session_not_found' || code === 'session_expired' || error.name === 'AuthSessionMissingError') {
      return fail('link_expired');
    }
    return fail('server');
  }
  await client.auth.signOut();
  return ok(undefined);
}

/** OP7: log out (no confirmation, PRD Section 5). The local session is always removed. */
export async function logOut(client: SupabaseClient = getSupabase()): Promise<Result> {
  const { error } = await client.auth.signOut({ scope: isOfflineNow() ? 'local' : 'global' });
  if (error) await client.auth.signOut({ scope: 'local' });
  return ok(undefined);
}
