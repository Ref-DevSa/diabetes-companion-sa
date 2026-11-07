import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

/**
 * The one Supabase client for the app. Uses only the public (publishable) key;
 * every permission is enforced by Row-Level Security in the database (Section 9).
 * The implicit flow lets a reset or confirmation link work on whichever phone opens it.
 */
export const clientOptions = {
  // No hidden retries: after 3 seconds a screen shows its error and "Try again" (PRD 12.1, BR23).
  db: { retry: false },
} as const;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
    if (!url || !key) {
      throw new Error('Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env');
    }
    client = createClient(url, key, {
      ...clientOptions,
      auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true },
    });
  }
  return client;
}
