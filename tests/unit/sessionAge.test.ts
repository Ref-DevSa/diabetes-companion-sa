import { describe, expect, it } from 'vitest';
import en from '../../src/i18n/en.json';
import { isSessionTooOld, SESSION_MAX_DAYS } from '../../src/auth/sessionAge';

const day = 24 * 60 * 60 * 1000;
const now = Date.parse('2026-11-07T10:00:00+02:00');

describe('T-AUTH-6: 30-day session (PRD Section 5)', () => {
  it('T-AUTH-6: the limit is 30 days', () => {
    expect(SESSION_MAX_DAYS).toBe(30);
  });

  it('T-AUTH-6: a session last signed in 29 days ago stays', () => {
    expect(isSessionTooOld(new Date(now - 29 * day).toISOString(), now)).toBe(false);
  });

  it('T-AUTH-6: a session last signed in 31 days ago is ended', () => {
    expect(isSessionTooOld(new Date(now - 31 * day).toISOString(), now)).toBe(true);
  });

  it('T-AUTH-6: exactly 30 days is still allowed; just over is not', () => {
    expect(isSessionTooOld(new Date(now - 30 * day).toISOString(), now)).toBe(false);
    expect(isSessionTooOld(new Date(now - 30 * day - 1000).toISOString(), now)).toBe(true);
  });

  it('T-AUTH-6: an unknown sign-in time is not treated as too old', () => {
    expect(isSessionTooOld(undefined, now)).toBe(false);
    expect(isSessionTooOld('not a date', now)).toBe(false);
  });
});

describe('T-EDGE-3: a session older than 30 days, or ended', () => {
  it('T-EDGE-3: 31 days after the last sign-in the session is ended, with the PRD message', () => {
    const now = Date.parse('2026-11-09T08:00:00Z');
    expect(isSessionTooOld('2026-10-09T07:59:00Z', now)).toBe(true);
    expect(en.errors.sessionEnded).toBe('Your session has ended. Please log in again.');
  });
});
