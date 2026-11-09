// Reading rules BR1 to BR4 and BR9 (PRD 4.4), checked in the app before saving and again in the database.
import { sastDateTimeToIso, sastParts } from './dates';

/** BR3: the five "When" values, in the PRD order. There is no default. */
export const READING_WHEN = ['fasting', 'before_meal', 'after_meal', 'bedtime', 'other'] as const;
export type ReadingWhen = (typeof READING_WHEN)[number];

export const NOTE_MAX = 200;
export const DAILY_LIMIT = 30;
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** What the person typed in M1. */
export type ReadingForm = { value: string; when: ReadingWhen | ''; date: string; time: string; note: string };

/** i18n keys of the message under each field. */
export type ReadingErrors = Partial<Record<'value' | 'when' | 'dateTime' | 'note', string>>;

export function isReadingWhen(value: unknown): value is ReadingWhen {
  return (READING_WHEN as readonly unknown[]).includes(value);
}

/**
 * BR1: a number from 1.0 to 40.0 with at most one decimal, written with a full stop (PRD 12.1).
 * Returns the number, or null when it is not allowed ("6,8" and "6.85" are not).
 */
export function parseReadingValue(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d{1,2}(\.\d)?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return value >= 1 && value <= 40 ? value : null;
}

/** BR2: today's date and the time now, in SAST, for a new Reading. */
export function defaultDateTime(now: number = Date.now()): { date: string; time: string } {
  return sastParts(now);
}

/** BR4: the counter under the note, like "0/200". */
export function noteCounter(note: string): string {
  return `${note.length}/${NOTE_MAX}`;
}

/** Checks BR1 to BR4. An empty object means the Reading can be saved. */
export function validateReading(form: ReadingForm, now: number = Date.now()): ReadingErrors {
  const errors: ReadingErrors = {};
  if (parseReadingValue(form.value) === null) errors.value = 'errors.readingValue';
  if (!isReadingWhen(form.when)) errors.when = 'errors.readingWhen';

  const takenAt = /^\d{4}-\d{2}-\d{2}$/.test(form.date) && /^\d{2}:\d{2}$/.test(form.time) ? Date.parse(sastDateTimeToIso(form.date, form.time)) : NaN;
  if (Number.isNaN(takenAt)) errors.dateTime = 'errors.readingDateTime';
  else if (takenAt > now + FUTURE_TOLERANCE_MS) errors.dateTime = 'errors.readingFuture';
  else if (takenAt < now - MAX_AGE_MS) errors.dateTime = 'errors.readingTooOld';

  if (form.note.length > NOTE_MAX) errors.note = 'errors.noteTooLong';
  return errors;
}

/** PRD 12.1: glucose in mmol/L with a full stop and one decimal, like "6.8". */
export function formatGlucose(value: number): string {
  return value.toFixed(1);
}
