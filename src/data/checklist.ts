// Checklist operations OP20 to OP25 (IMPLEMENTATION_PLAN.md Section 10). RLS keeps Custom Items and ticks to their owner.
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import { fail, isNetworkError, isOfflineNow, ok, type ErrorCode, type Result } from '../lib/errors';
import { isStandardKey, type StandardKey } from '../lib/checklistRules';
import { sastToday } from '../lib/dates';

export type ChecklistItem = {
  id: string;
  isStandard: boolean;
  /** Set for the four Standard Items; the app shows their translated name by this key (BR10). */
  standardKey: StandardKey | null;
  name: string;
};

export type TodayChecklist = {
  /** Today's SAST date, "YYYY-MM-DD" (BR12). */
  date: string;
  /** Standard Items first, then Custom Items oldest first (BR10, BR11). */
  items: ChecklistItem[];
  /** The Items ticked today. */
  tickedIds: string[];
};

const COLUMNS = 'id, is_standard, standard_key, name';
const UNIQUE_VIOLATION = '23505';

function toItem(row: Record<string, unknown>): ChecklistItem {
  return {
    id: String(row.id),
    isStandard: row.is_standard === true,
    standardKey: isStandardKey(row.standard_key) ? row.standard_key : null,
    name: String(row.name),
  };
}

/** Database refusals (Section 8.6 triggers and the unique index) become the matching PRD message. */
function codeFor(error: PostgrestError): ErrorCode {
  if (isNetworkError(error)) return 'offline';
  if (error.message === 'custom_item_limit') return 'custom_item_limit';
  if (error.code === UNIQUE_VIOLATION) return 'item_name_taken';
  return 'server';
}

async function currentUserId(client: SupabaseClient): Promise<Result<string>> {
  const { data, error } = await client.auth.getSession();
  if (error && isNetworkError(error)) return fail('offline');
  const userId = data.session?.user.id;
  return userId ? ok(userId) : fail('server');
}

/** OP20: today's Checklist: every Item the User can see, with today's ticks (BR12). */
export async function getTodayChecklist(client: SupabaseClient = getSupabase()): Promise<Result<TodayChecklist>> {
  if (isOfflineNow()) return fail('offline');
  const date = sastToday();
  const [items, ticks] = await Promise.all([
    client.from('checklist_items').select(COLUMNS).order('sort_order').order('created_at'),
    client.from('checklist_ticks').select('item_id').eq('tick_date', date),
  ]);
  if (items.error) return fail(codeFor(items.error));
  if (ticks.error) return fail(codeFor(ticks.error));
  return ok({
    date,
    items: (items.data ?? []).map(toItem),
    tickedIds: (ticks.data ?? []).map((row) => String(row.item_id)),
  });
}

/** OP21: ticks an Item for today. Ticking an Item that is already ticked is harmless. */
export async function tickItem(itemId: string, client: SupabaseClient = getSupabase()): Promise<Result> {
  if (isOfflineNow()) return fail('offline');
  const user = await currentUserId(client);
  if (!user.ok) return user;
  const { error } = await client.from('checklist_ticks').insert({ user_id: user.data, item_id: itemId });
  if (error && error.code !== UNIQUE_VIOLATION) return fail(isNetworkError(error) ? 'offline' : 'server');
  return ok(undefined);
}

/** OP22: removes today's tick for an Item. Ticks from earlier days cannot be changed (SEC15). */
export async function untickItem(itemId: string, client: SupabaseClient = getSupabase()): Promise<Result> {
  if (isOfflineNow()) return fail('offline');
  const { error } = await client.from('checklist_ticks').delete().eq('item_id', itemId).eq('tick_date', sastToday());
  if (error) return fail(isNetworkError(error) ? 'offline' : 'server');
  return ok(undefined);
}

/** OP23: adds a Custom Item after the others (BR11). */
export async function addCustomItem(name: string, client: SupabaseClient = getSupabase()): Promise<Result<ChecklistItem>> {
  if (isOfflineNow()) return fail('offline');
  const user = await currentUserId(client);
  if (!user.ok) return user;
  const { data, error } = await client.from('checklist_items').insert({ user_id: user.data, name: name.trim() }).select(COLUMNS).single();
  if (error) return fail(codeFor(error));
  return ok(toItem(data));
}

/** OP24: renames one of the User's Custom Items; "not_found" when there is no such Item of theirs. */
export async function renameCustomItem(id: string, name: string, client: SupabaseClient = getSupabase()): Promise<Result<ChecklistItem>> {
  if (isOfflineNow()) return fail('offline');
  const { data, error } = await client.from('checklist_items').update({ name: name.trim() }).eq('id', id).select(COLUMNS).maybeSingle();
  if (error) return fail(codeFor(error));
  if (!data) return fail('not_found');
  return ok(toItem(data));
}

/** OP25: deletes one of the User's Custom Items; its ticks go with it (BR11). */
export async function deleteCustomItem(id: string, client: SupabaseClient = getSupabase()): Promise<Result> {
  if (isOfflineNow()) return fail('offline');
  const { data, error } = await client.from('checklist_items').delete().eq('id', id).select('id');
  if (error) return fail(codeFor(error));
  if (!data || data.length === 0) return fail('not_found');
  return ok(undefined);
}
