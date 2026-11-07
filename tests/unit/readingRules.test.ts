import { describe, expect, it } from 'vitest';
import en from '../../src/i18n/en.json';
import { errorMessageKey } from '../../src/lib/errors';
import {
  DAILY_LIMIT,
  NOTE_MAX,
  READING_WHEN,
  defaultDateTime,
  noteCounter,
  parseReadingValue,
  validateReading,
  type ReadingForm,
} from '../../src/lib/readingRules';

// 27 Oct 2026, 09:41 SAST (07:41 UTC)
const now = Date.parse('2026-10-27T07:41:00Z');
const valid: ReadingForm = { value: '6.8', when: 'fasting', date: '2026-10-27', time: '07:10', note: '' };

function t(key: string): string {
  return key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], en) as string;
}

describe('BR1: value 1.0 to 40.0, one decimal', () => {
  it('T-BR1-1: 1.0, 40.0, 6.8 and whole numbers are valid', () => {
    expect(parseReadingValue('1.0')).toBe(1);
    expect(parseReadingValue('40.0')).toBe(40);
    expect(parseReadingValue('6.8')).toBe(6.8);
    expect(parseReadingValue(' 7 ')).toBe(7);
  });

  it.each(['0.9', '40.1', '6.85', '45', '', 'abc', '6.8.1', '-5', '1e1', '6,8'])('T-BR1-2: "%s" is invalid', (text) => {
    expect(parseReadingValue(text)).toBeNull();
  });

  it('T-BR1-2: "6,8" is rejected with the same message as any wrong number', () => {
    expect(validateReading({ ...valid, value: '6,8' }, now).value).toBe('errors.readingValue');
    expect(validateReading({ ...valid, value: '45' }, now).value).toBe('errors.readingValue');
    expect(t('errors.readingValue')).toBe('Enter a number from 1.0 to 40.0.');
  });
});

describe('BR2: date and time', () => {
  it('T-BR2-1: the default date and time are now, in SAST', () => {
    expect(defaultDateTime(now)).toEqual({ date: '2026-10-27', time: '09:41' });
    // 23:30 UTC is already the next day in SAST
    expect(defaultDateTime(Date.parse('2026-10-27T23:30:00Z'))).toEqual({ date: '2026-10-28', time: '01:30' });
  });

  it('T-BR2-2: up to 5 minutes ahead is allowed (clock difference); more is "in the future"', () => {
    expect(validateReading({ ...valid, time: '09:46' }, now).dateTime).toBeUndefined();
    expect(validateReading({ ...valid, time: '09:47' }, now).dateTime).toBe('errors.readingFuture');
    expect(t('errors.readingFuture')).toBe("The date and time can't be in the future.");
  });

  it('T-BR2-2: 30 days back is allowed; one minute more is too old', () => {
    expect(validateReading({ ...valid, date: '2026-09-27', time: '09:41' }, now).dateTime).toBeUndefined();
    expect(validateReading({ ...valid, date: '2026-09-27', time: '09:40' }, now).dateTime).toBe('errors.readingTooOld');
    expect(t('errors.readingTooOld')).toBe('You can only add readings from the last 30 days.');
  });

  it('T-BR2-2: a missing date or time is not valid (wording: Section 18, question 31)', () => {
    expect(validateReading({ ...valid, date: '' }, now).dateTime).toBeTruthy();
    expect(validateReading({ ...valid, time: '' }, now).dateTime).toBeTruthy();
  });
});

describe('BR3: When', () => {
  it('T-BR3-1: only the five When values exist, in the PRD order', () => {
    expect(READING_WHEN).toEqual(['fasting', 'before_meal', 'after_meal', 'bedtime', 'other']);
    expect(['Fasting', 'Before a meal', 'After a meal', 'Bedtime', 'Other']).toEqual(READING_WHEN.map((w) => t(`when.${w}`)));
  });

  it('T-BR3-1: there is no default: an empty When is an error', () => {
    expect(validateReading({ ...valid, when: '' }, now).when).toBe('errors.readingWhen');
    expect(t('errors.readingWhen')).toBe('Choose when you took this reading.');
  });
});

describe('BR4: note', () => {
  it('T-BR4-1: 200 characters are valid; 201 are not', () => {
    expect(NOTE_MAX).toBe(200);
    expect(validateReading({ ...valid, note: 'a'.repeat(200) }, now).note).toBeUndefined();
    expect(validateReading({ ...valid, note: 'a'.repeat(201) }, now).note).toBe('errors.noteTooLong');
    expect(t('errors.noteTooLong')).toBe('Notes can be up to 200 characters.');
  });

  it('T-BR4-1: the counter reads like "0/200"', () => {
    expect(noteCounter('')).toBe('0/200');
    expect(noteCounter('Skipped supper')).toBe('14/200');
  });

  it('T-BR1 to T-BR4: a correct form has no errors', () => {
    expect(validateReading(valid, now)).toEqual({});
  });
});

describe('BR9: 30 Readings a day', () => {
  it('T-BR9-1: the limit is 30, with the PRD message', () => {
    expect(DAILY_LIMIT).toBe(30);
    expect(t(errorMessageKey.daily_limit)).toBe("You've reached today's limit of 30 readings. You can add more tomorrow.");
  });
});

describe('Edge cases 5 and 6', () => {
  it('T-EDGE-5: a phone clock set ahead gives "in the future" and nothing else changes', () => {
    const errors = validateReading({ ...valid, date: '2026-10-28', time: '09:41' }, now);
    expect(errors).toEqual({ dateTime: 'errors.readingFuture' });
  });

  it('T-EDGE-6: older than 30 days gives "only the last 30 days"', () => {
    expect(validateReading({ ...valid, date: '2026-09-01' }, now)).toEqual({ dateTime: 'errors.readingTooOld' });
  });
});
