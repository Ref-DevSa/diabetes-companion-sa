// Dates written like "27 Oct 2026" (PRD 12.1). More SAST helpers arrive with the Diary (Phase 5).

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
