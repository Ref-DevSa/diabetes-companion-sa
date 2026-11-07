import { afterAll, describe, expect, it } from 'vitest';
import { logIn, resendConfirmation, signUp } from '../../src/data/auth';
import { admin, anonClient, countEmails, createUser, removeCreatedUsers, sleep, testPassword, track, uniqueEmail, waitForEmail } from '../helpers/supabaseTest';

afterAll(removeCreatedUsers);

async function failures(email: string) {
  const { count } = await admin.from('login_attempts').select('*', { count: 'exact', head: true }).eq('email', email);
  return count ?? 0;
}

describe('OP3, OP4 Log in (US2)', () => {
  it('T-US2-1: a confirmed account logs in with the correct details', async () => {
    const user = await createUser('login');
    const client = anonClient();
    expect(await logIn(user.email, user.password, client)).toEqual({ ok: true, data: undefined });
    const { data } = await client.auth.getSession();
    expect(data.session?.user.email).toBe(user.email);
  });

  it('T-US2-2: a wrong password gives "wrong_credentials" and records one failure', async () => {
    const user = await createUser('wrong');
    expect(await logIn(user.email, 'wrongpass1', anonClient())).toEqual({ ok: false, code: 'wrong_credentials' });
    expect(await failures(user.email)).toBe(1);
  });

  it('T-US2-3: after 5 wrong passwords, the 6th try within 15 minutes gives "too_many_tries"', async () => {
    const user = await createUser('lock');
    for (let i = 0; i < 5; i += 1) {
      expect(await logIn(user.email, `wrongpass${i}`, anonClient())).toEqual({ ok: false, code: 'wrong_credentials' });
    }
    expect(await logIn(user.email, user.password, anonClient())).toEqual({ ok: false, code: 'too_many_tries' });
  });

  it('T-US2-4 / T-AUTH-2: before confirming, the account cannot log in', async () => {
    const email = uniqueEmail('unconfirmed');
    track(email);
    expect(await signUp({ email, password: testPassword }, anonClient())).toEqual({ ok: true, data: undefined });
    const client = anonClient();
    expect(await logIn(email, testPassword, client)).toEqual({ ok: false, code: 'unconfirmed' });
    const { data } = await client.auth.getSession();
    expect(data.session).toBeNull();
  });

  it('T-INT-1: "Send the email again" sends a new confirmation email', async () => {
    const email = uniqueEmail('resend');
    track(email);
    await signUp({ email, password: testPassword }, anonClient());
    await waitForEmail(email, 1);
    await sleep(1500);
    expect(await resendConfirmation(email, anonClient())).toEqual({ ok: true, data: undefined });
    const mail = await waitForEmail(email, 2);
    expect(mail.Subject).toBe('Confirm your email for Diabetes Companion SA');
    expect(await countEmails(email)).toBe(2);
  });
});
