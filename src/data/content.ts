// Content operations OP11 and OP12 (IMPLEMENTATION_PLAN.md Section 10).
// Explicit column lists: never "*" and never reviewed_by (SEC16 to SEC19). RLS returns published rows only.
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import { fail, isNetworkError, isOfflineNow, ok, type Result } from '../lib/errors';
import { pickText } from '../lib/pickText';
import type { LanguageCode } from '../i18n/languages';

export type Topic = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  readingMinutes: number;
  /** Date the English text was reviewed (BR22), "YYYY-MM-DD". */
  reviewedAt: string | null;
};

export type SafetySection = 'low' | 'high' | 'urgent';

export type SafetyItem = {
  id: string;
  section: SafetySection;
  text: string;
  reviewedAt: string | null;
};

type Row = Record<string, unknown>;

const TOPIC_COLUMNS =
  'id, slug, title_en, title_zu, title_tn, summary_en, summary_zu, summary_tn, body_en, body_zu, body_tn, reading_minutes, sort_order, reviewed_at';
const SAFETY_COLUMNS = 'id, section, text_en, text_zu, text_tn, sort_order, reviewed_at';

/** A Topic row in the chosen language, English where a translation is missing (BR17). */
export function localizeTopic(row: Row, language: LanguageCode): Topic {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: pickText(row, 'title', language),
    summary: pickText(row, 'summary', language),
    body: pickText(row, 'body', language),
    readingMinutes: Number(row.reading_minutes),
    reviewedAt: typeof row.reviewed_at === 'string' ? row.reviewed_at : null,
  };
}

export function localizeSafetyItem(row: Row, language: LanguageCode): SafetyItem {
  return {
    id: String(row.id),
    section: row.section as SafetySection,
    text: pickText(row, 'text', language),
    reviewedAt: typeof row.reviewed_at === 'string' ? row.reviewed_at : null,
  };
}

/** OP11: published Topics, lowest sort order first. */
export async function listTopics(language: LanguageCode, client: SupabaseClient = getSupabase()): Promise<Result<Topic[]>> {
  if (isOfflineNow()) return fail('offline');
  const { data, error } = await client.from('topics').select(TOPIC_COLUMNS).order('sort_order');
  if (error) return fail(isNetworkError(error) ? 'offline' : 'server');
  return ok((data ?? []).map((row) => localizeTopic(row, language)));
}

/** OP12: published Safety Guide items, in order; the screen groups them by section. */
export async function listSafetyItems(language: LanguageCode, client: SupabaseClient = getSupabase()): Promise<Result<SafetyItem[]>> {
  if (isOfflineNow()) return fail('offline');
  const { data, error } = await client.from('safety_items').select(SAFETY_COLUMNS).order('sort_order');
  if (error) return fail(isNetworkError(error) ? 'offline' : 'server');
  return ok((data ?? []).map((row) => localizeSafetyItem(row, language)));
}
