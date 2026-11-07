import { afterAll, describe, expect, it } from 'vitest';
import { requestPasswordReset, signUp } from '../../src/data/auth';
import { anonClient, createUser, linkIn, removeCreatedUsers, testPassword, track, uniqueEmail, waitForEmail } from '../helpers/supabaseTest';

afterAll(removeCreatedUsers);

/** The email text with line breaks and repeated spaces flattened. */
const flat = (text: string) => text.replace(/\s+/g, ' ').trim();

describe('T-AUTH-9: the two system emails use the exact PRD 4.5 wording', () => {
  it('T-AUTH-9: the confirmation email', async () => {
    const email = uniqueEmail('mail-confirm');
    track(email);
    await signUp({ email, password: testPassword }, anonClient());
    const mail = await waitForEmail(email);
    expect(mail.Subject).toBe('Confirm your email for Diabetes Companion SA');
    expect(flat(mail.Text)).toContain(
      "Hi! Tap the button to confirm your email and finish signing up. The link works for 1 hour. If you didn't sign up, you can ignore this email.",
    );
    expect(linkIn(mail)).toContain('/auth/v1/verify');
  });

  it('T-AUTH-9: the reset email', async () => {
    const user = await createUser('mail-reset');
    await requestPasswordReset(user.email, anonClient());
    const mail = await waitForEmail(user.email);
    expect(mail.Subject).toBe('Reset your Diabetes Companion SA password');
    expect(flat(mail.Text)).toContain(
      "Tap the button to choose a new password. The link works for 1 hour. If you didn't ask for this, you can ignore this email.",
    );
    expect(linkIn(mail)).toContain('type=recovery');
  });
});
