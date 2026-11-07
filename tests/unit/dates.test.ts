import { describe, expect, it } from 'vitest';
import { formatDay, latestDate } from '../../src/lib/dates';

describe('Dates written like 27 Oct 2026 (PRD 12.1)', () => {
  it('T-BR22-3: a review date is written DD Mon YYYY', () => {
    expect(formatDay('2026-10-27')).toBe('27 Oct 2026');
    expect(formatDay('2026-01-05')).toBe('05 Jan 2026');
    expect(formatDay('2027-12-31')).toBe('31 Dec 2027');
  });

  it('T-BR22-3: an unknown date gives an empty text', () => {
    expect(formatDay(null)).toBe('');
    expect(formatDay('not-a-date')).toBe('');
  });

  it('T-BR22-3: the latest of several review dates is chosen', () => {
    expect(latestDate(['2026-10-01', null, '2026-11-03', '2026-02-14'])).toBe('2026-11-03');
    expect(latestDate([null, null])).toBeNull();
  });
});
