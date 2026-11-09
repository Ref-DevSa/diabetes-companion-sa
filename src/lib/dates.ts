// Dates written like "27 Oct 2026" (PRD 12.1) and SAST (UTC+2) helpers for the Diary and Checklist.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A calendar date "YYYY-MM-DD" written as "DD Mon YYYY"; '' when there is no valid date. */
export function formatDay(date: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date ?? '');
  if (!match) return '';
  const [, year, month, day] = match;
  const name = MONTHS[Number(month) - 1];
  return name ? `${day} ${name} ${year}` : '';
}

/** The latest of several "YYYY-MM-DD" dates (they sort as text), or null. */
export function latestDate(dates: Array<string | null | undefined>): string | null {
  const known = dates.filter((date): date is string => typeof date === 'string' && date !== '');
  return known.length === 0 ? null : known.reduce((latest, date) => (date > latest ? date : latest));
}

// ---------------------------------------------------------------- SAST (UTC+2, no daylight saving)
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

/** The SAST date ("YYYY-MM-DD") and 24-hour time ("HH:MM") of a moment. */
export function sastParts(moment: number | string): { date: string; time: string } {
  const ms = typeof moment === 'number' ? moment : Date.parse(moment);
  const iso = new Date(ms + SAST_OFFSET_MS).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

/** A SAST date and time as one moment, in UTC ISO form for the database. */
export function sastDateTimeToIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00+02:00`).toISOString();
}

/** A saved moment written like "27 Oct 2026, 07:10" in SAST (PRD 12.1). */
export function formatDateTime(moment: string): string {
  const { date, time } = sastParts(moment);
  return `${formatDay(date)}, ${time}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** BR12: today's SAST calendar date ("YYYY-MM-DD"); the day changes at 00:00 SAST. */
export function sastToday(now: number = Date.now()): string {
  return sastParts(now).date;
}

/** BR12: milliseconds from `now` until the next 00:00 SAST. */
export function msUntilSastMidnight(now: number = Date.now()): number {
  const sinceMidnight = (now + SAST_OFFSET_MS) % DAY_MS;
  return DAY_MS - sinceMidnight;
}

/** A calendar date written like "Tue 27 Oct 2026" (S9 title). */
export function formatWeekday(date: string): string {
  const day = formatDay(date);
  if (!day) return '';
  const weekday = WEEKDAYS[new Date(`${date.slice(0, 10)}T00:00:00Z`).getUTCDay()];
  return `${weekday} ${day}`;
}

/** A saved moment as a short SAST date like "27 Oct" (S10). */
export function formatShortDate(moment: string): string {
  return formatDay(sastParts(moment).date).slice(0, 6);
}
