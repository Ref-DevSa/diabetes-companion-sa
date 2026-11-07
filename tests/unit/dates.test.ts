import { describe, expect, it } from 'vitest';
import { formatDateTime, formatDay, latestDate, sastDateTimeToIso } from '../../src/lib/dates';

describe('SAST date and time for Readings (PRD 12.1, BR2)', () => {
  it('T-BR2-1: a SAST date and 24-hour time become one moment (UTC+2)', () => {
    expect(sastDateTimeToIso('2026-10-27', '07:10')).toBe('2026-10-27T05:10:00.000Z');
  });

  it('T-BR2-1: a saved moment is shown in SAST like "27 Oct 2026, 07:10"', () => {
    expect(formatDateTime('2026-10-27T05:10:00Z')).toBe('27 Oct 2026, 07:10');
    expect(formatDateTime('2026-10-26T19:30:00+00:00')).toBe('26 Oct 2026, 21:30');
    expect(formatDateTime('2026-10-26T23:30:00Z')).toBe('27 Oct 2026, 01:30');
  });
});

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
