// Profile operations OP8 to OP10 (IMPLEMENTATION_PLAN.md Section 10).
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import { databaseErrorCode, fail, isOfflineNow, ok, type Result } from '../lib/errors';
import { isLanguageCode, type LanguageCode } from '../i18n/languages';

export type Profile = { id: string; email: string; language: LanguageCode };

/** OP8: the logged-in User's own profile (SEC1: RLS returns no other row). */
export async function getProfile(client: SupabaseClient = getSupabase()): Promise<Result<Profile>> {
  if (isOfflineNow()) return fail('offline');
  const { data, error } = await client.from('users').select('id, email, language').maybeSingle();
  if (error) return fail(databaseErrorCode(error));
  if (!data) return fail('server');
  return ok({ id: data.id as string, email: data.email as string, language: isLanguageCode(data.language) ? data.language : 'en' });
}

/** OP9: saves the language to the account (BR17, SEC2: only the language column can change). */
export async function setLanguage(language: LanguageCode, client: SupabaseClient = getSupabase()): Promise<Result> {
  if (isOfflineNow()) return fail('offline');
  const { data: auth } = await client.auth.getSession();
  const userId = auth.session?.user.id;
  if (!userId) return fail('server');
  const { data, error } = await client.from('users').update({ language }).eq('id', userId).select('id');
  if (error) return fail(databaseErrorCode(error));
  if (!data || data.length === 0) return fail('server');
  return ok(undefined);
}

/**
 * OP10: deletes the caller's account and all their data (BR20). The screen moves to S1 first and
 * then calls logOut(), so the person never sees a protected screen without an account.
 */
export async function deleteMyAccount(client: SupabaseClient = getSupabase()): Promise<Result> {
  if (isOfflineNow()) return fail('offline');
  const { error } = await client.rpc('delete_my_account');
  if (error) return fail(databaseErrorCode(error));
  return ok(undefined);
}
