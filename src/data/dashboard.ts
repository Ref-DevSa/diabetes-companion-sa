// Dashboard operation OP19 (IMPLEMENTATION_PLAN.md Section 10): the 7 newest Readings and today's progress.
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import { checklistProgress } from '../lib/checklistRules';
import { fail, isNetworkError, isOfflineNow, ok, type Result } from '../lib/errors';
import { getTodayChecklist } from './checklist';
import { READING_COLUMNS, toReading, type Reading } from './readings';

export type DashboardData = {
  /** The 7 newest Readings, newest first (F5). */
  readings: Reading[];
  /** Today's "X of Y done" (BR13). */
  progress: ReturnType<typeof checklistProgress>;
};

/** F5: the Dashboard shows the last 7 Readings. */
export const DASHBOARD_READINGS = 7;

/** OP19: RLS returns only the User's own Readings and ticks. */
export async function getDashboard(client: SupabaseClient = getSupabase()): Promise<Result<DashboardData>> {
  if (isOfflineNow()) return fail('offline');
  const [readings, today] = await Promise.all([
    client
      .from('readings')
      .select(READING_COLUMNS)
      .order('taken_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(DASHBOARD_READINGS),
    getTodayChecklist(client),
  ]);
  if (readings.error) return fail(isNetworkError(readings.error) ? 'offline' : 'server');
  if (!today.ok) return today;
  return ok({
    readings: (readings.data ?? []).map(toReading),
    progress: checklistProgress(
      today.data.items.map((item) => item.id),
      today.data.tickedIds,
    ),
  });
}
