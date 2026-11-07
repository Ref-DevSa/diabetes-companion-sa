// Diary operations OP15 to OP18 (IMPLEMENTATION_PLAN.md Section 10). RLS keeps every Reading to its owner.
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import { fail, isNetworkError, isOfflineNow, ok, type ErrorCode, type Result } from '../lib/errors';
import { isReadingWhen, type ReadingWhen } from '../lib/readingRules';

export type Reading = {
  id: string;
  value: number;
  when: ReadingWhen;
  /** When it was taken, as an ISO moment (shown in SAST). */
  takenAt: string;
  note: string | null;
};

export type ReadingInput = { value: number; when: ReadingWhen; takenAt: string; note: string | null };

/** BR7: the Diary shows 20 Readings at a time. */
export const PAGE_SIZE = 20;

const COLUMNS = 'id, value, reading_when, taken_at, note';

function toReading(row: Record<string, unknown>): Reading {
  return {
    id: String(row.id),
    value: Number(row.value),
    when: isReadingWhen(row.reading_when) ? row.reading_when : 'other',
    takenAt: new Date(String(row.taken_at)).toISOString(),
    note: typeof row.note === 'string' && row.note !== '' ? row.note : null,
  };
}

/** Database refusals (Section 8.5 triggers) become the matching PRD message. */
function codeFor(error: PostgrestError): ErrorCode {
  if (isNetworkError(error)) return 'offline';
  if (error.message === 'reading_future') return 'reading_future';
  if (error.message === 'reading_too_old') return 'reading_too_old';
  if (error.message === 'daily_limit') return 'daily_limit';
  return 'server';
}

function toRow(input: ReadingInput) {
  return { value: input.value, reading_when: input.when, taken_at: input.takenAt, note: input.note && input.note.trim() !== '' ? input.note : null };
}

/** OP15: the next 20 Readings after the first `offset`, newest first by date and time (BR7). */
export async function listReadings(
  offset: number,
  client: SupabaseClient = getSupabase(),
): Promise<Result<{ readings: Reading[]; hasMore: boolean }>> {
  if (isOfflineNow()) return fail('offline');
  const { data, error } = await client
    .from('readings')
    .select(COLUMNS)
    .order('taken_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + PAGE_SIZE);
  if (error) return fail(codeFor(error));
  const rows = data ?? [];
  return ok({ readings: rows.slice(0, PAGE_SIZE).map(toReading), hasMore: rows.length > PAGE_SIZE });
}

/** OP16: saves a new Reading. Nothing is reported saved until the database has confirmed it (BR23). */
export async function addReading(input: ReadingInput, client: SupabaseClient = getSupabase()): Promise<Result<Reading>> {
  if (isOfflineNow()) return fail('offline');
  const { data: auth, error: authError } = await client.auth.getSession();
  if (authError && isNetworkError(authError)) return fail('offline');
  const userId = auth.session?.user.id;
  if (!userId) return fail('server');
  const { data, error } = await client.from('readings').insert({ user_id: userId, ...toRow(input) }).select(COLUMNS).single();
  if (error) return fail(codeFor(error));
  return ok(toReading(data));
}

/** OP17: saves changes to a Reading; "not_found" when it no longer exists (deleted on another phone). */
export async function updateReading(id: string, input: ReadingInput, client: SupabaseClient = getSupabase()): Promise<Result<Reading>> {
  if (isOfflineNow()) return fail('offline');
  const { data, error } = await client.from('readings').update(toRow(input)).eq('id', id).select(COLUMNS).maybeSingle();
  if (error) return fail(codeFor(error));
  if (!data) return fail('not_found');
  return ok(toReading(data));
}

/** OP18: deletes one Reading (after M4); "not_found" when there was nothing of the User's to delete. */
export async function deleteReading(id: string, client: SupabaseClient = getSupabase()): Promise<Result> {
  if (isOfflineNow()) return fail('offline');
  const { data, error } = await client.from('readings').delete().eq('id', id).select('id');
  if (error) return fail(codeFor(error));
  if (!data || data.length === 0) return fail('not_found');
  return ok(undefined);
}
