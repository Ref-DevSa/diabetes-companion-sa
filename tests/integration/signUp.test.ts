import { afterAll, describe, expect, it } from 'vitest';
import { signUp } from '../../src/data/auth';
import { PRIVACY_NOTICE_VERSION } from '../../src/lib/privacyNotice';
import { admin, anonClient, createUser, findAuthUser, removeCreatedUsers, testPassword, track, uniqueEmail, waitForEmail } from '../helpers/supabaseTest';

afterAll(removeCreatedUsers);

describe('OP1 Sign up (US1)', () => {
  it('T-US1-1: valid details create an account and send the confirmation email', async () => {
    const email = uniqueEmail('signup');
    track(email);
    const result = await signUp({ email, password: testPassword }, anonClient());
    expect(result).toEqual({ ok: true, data: undefined });

    const authUser = await findAuthUser(email);
    expect(authUser?.email_confirmed_at ?? null).toBeNull();
    const { data: profile } = await admin
      .from('users')
      .select('email, language, privacy_notice_version, age_confirmed_at, privacy_agreed_at')
      .eq('email', email)
      .single();
    expect(profile).toMatchObject({ email, language: 'en', privacy_notice_version: PRIVACY_NOTICE_VERSION });
    expect(profile?.age_confirmed_at).toBeTruthy();
    expect(profile?.privacy_agreed_at).toBeTruthy();

    const mail = await waitForEmail(email);
    expect(mail.Subject).toBe('Confirm your email for Diabetes Companion SA');
  });

  it('T-US1-2: without "I confirm I am 18 or older" no account is created (the database refuses)', async () => {
    const email = uniqueEmail('noage');
    track(email);
    const { error } = await anonClient().auth.signUp({
      email,
      password: testPassword,
      options: { data: { privacy_agreed: 'true', privacy_notice_version: PRIVACY_NOTICE_VERSION } },
    });
    expect(error).not.toBeNull();
    expect(await findAuthUser(email)).toBeNull();
  });

  it('T-US1-3: an already registered email gives "email_taken"', async () => {
    const existing = await createUser('taken');
    const result = await signUp({ email: existing.email, password: testPassword }, anonClient());
    expect(result).toEqual({ ok: false, code: 'email_taken' });
  });

  it('T-US1-4: the server also refuses a password shorter than 8 characters', async () => {
    const email = uniqueEmail('weak');
    track(email);
    const result = await signUp({ email, password: 'abc' }, anonClient());
    expect(result).toEqual({ ok: false, code: 'weak_password' });
    expect(await findAuthUser(email)).toBeNull();
  });
});
