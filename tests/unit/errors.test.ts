import { afterEach, describe, expect, it, vi } from 'vitest';
import en from '../../src/i18n/en.json';
import { databaseErrorCode, errorMessageKey, isAccountGone, isNetworkError, onSessionEnded } from '../../src/lib/errors';

function t(key: string): string {
  return key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], en) as string;
}

const stops: Array<() => void> = [];
afterEach(() => {
  while (stops.length) stops.pop()?.();
});

describe('Central handling of database errors (Phase 8 Step 3, PRD 6.2 and 12.2)', () => {
  it('BR23: a network failure is "offline"', () => {
    expect(databaseErrorCode({ message: 'TypeError: Failed to fetch' })).toBe('offline');
  });

  it('T-EDGE-2: an unknown error is "server", with the PRD text', () => {
    expect(databaseErrorCode({ code: '42P01', message: 'relation does not exist' })).toBe('server');
    expect(t(errorMessageKey.server)).toBe('Something went wrong on our side. Please try again.');
  });

  it('a screen-specific rule is used when it matches', () => {
    const specific = (error: { message?: string }) => (error.message === 'daily_limit' ? ('daily_limit' as const) : undefined);
    expect(databaseErrorCode({ code: 'P0001', message: 'daily_limit' }, specific)).toBe('daily_limit');
    expect(databaseErrorCode({ code: 'P0001', message: 'other' }, specific)).toBe('server');
  });

  it('T-EDGE-9: a save refused because the account no longer exists ends the session, with the PRD text', () => {
    const listener = vi.fn();
    stops.push(onSessionEnded(listener));
    const gone = { code: '23503', message: 'insert or update on table "readings" violates foreign key constraint "readings_user_id_fkey"' };
    expect(databaseErrorCode(gone)).toBe('session_ended');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(t(errorMessageKey.session_ended)).toBe('Your session has ended. Please log in again.');
  });

  it('T-EDGE-9: an expired or rejected login token ends the session', () => {
    const listener = vi.fn();
    stops.push(onSessionEnded(listener));
    expect(databaseErrorCode({ code: 'PGRST301', message: 'JWT expired' })).toBe('session_ended');
    expect(databaseErrorCode({ code: 'PGRST303', message: 'JWT claims invalid' })).toBe('session_ended');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('a different missing link (for example an Item deleted on another phone) is not a session end', () => {
    const listener = vi.fn();
    stops.push(onSessionEnded(listener));
    expect(databaseErrorCode({ code: '23503', message: 'violates foreign key constraint "checklist_ticks_item_id_fkey"' })).toBe('server');
    expect(listener).not.toHaveBeenCalled();
  });

  it('onSessionEnded returns a way to stop listening', () => {
    const listener = vi.fn();
    const stop = onSessionEnded(listener);
    stop();
    databaseErrorCode({ code: 'PGRST301', message: 'JWT expired' });
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('T-EDGE-9: checking the account with Supabase Auth', () => {
  it.each([
    [{ status: 403, code: 'user_not_found' }, true],
    [{ status: 401, code: 'bad_jwt' }, true],
    [{ status: 403, code: 'session_not_found' }, true],
    [{ status: 500, code: 'unexpected_failure' }, false],
    [{ name: 'AuthRetryableFetchError', status: 0 }, false],
    [null, false],
  ])('isAccountGone(%j) is %s', (error, expected) => {
    expect(isAccountGone(error)).toBe(expected);
  });
});

describe('BR23 / T-EDGE-2: "offline" only when there was no answer at all', () => {
  it('no connection (no answer, status 0) is offline', () => {
    expect(isNetworkError({ name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' })).toBe(true);
    expect(isNetworkError({ name: 'TypeError', message: 'Failed to fetch' })).toBe(true);
  });

  it('a server answer such as 500, 502, 503 or 504 is not offline (live sign-up, 09 Nov 2026: a 500 was shown as "offline")', () => {
    for (const status of [500, 502, 503, 504]) {
      expect(isNetworkError({ name: 'AuthRetryableFetchError', status, message: '525 "5.7.1 Unauthorized IP address"' }), String(status)).toBe(false);
    }
  });
});
