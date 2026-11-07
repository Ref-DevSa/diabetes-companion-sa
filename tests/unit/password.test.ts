import { describe, expect, it } from 'vitest';
import { isValidEmail, isValidPassword } from '../../src/lib/password';

describe('T-AUTH-3: password and email rules (PRD Section 5)', () => {
  it('T-AUTH-3: accepts 8 or more characters with at least one number', () => {
    expect(isValidPassword('abcdefg1')).toBe(true);
    expect(isValidPassword('1234567a')).toBe(true);
    expect(isValidPassword('a longer pass phrase 7')).toBe(true);
  });

  it.each(['abcdefgh', 'abc1', '1234567', ''])('T-AUTH-3: rejects "%s"', (password) => {
    expect(isValidPassword(password)).toBe(false);
  });

  it('T-AUTH-3: an email needs a name, an @ and a domain with a dot', () => {
    expect(isValidEmail('thabo.test@example.co.za')).toBe(true);
    expect(isValidEmail(' thabo.test@example.co.za ')).toBe(true);
    for (const email of ['', 'thabo', 'thabo@', '@example.co.za', 'thabo@example', 'thabo test@example.co.za']) {
      expect(isValidEmail(email), email).toBe(false);
    }
  });
});
