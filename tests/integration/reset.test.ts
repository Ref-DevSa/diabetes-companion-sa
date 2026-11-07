import { afterAll, describe, expect, it } from 'vitest';
import { logIn, requestPasswordReset, saveNewPassword } from '../../src/data/auth';
import { readAuthRedirect } from '../../src/auth/authRedirect';
import { checkNewPassword } from '../../src/lib/password';
import { anonClient, countEmails, createUser, followLink, linkIn, removeCreatedUsers, sleep, uniqueEmail, waitForEmail } from '../helpers/supabaseTest';

afterAll(removeCreatedUsers);

/** What the app sends from a browser: its own S4 address (Node has no page address). */
const S4_ADDRESS = 'http://localhost:5173/forgot-password';

/** Opens the reset link and returns a client holding the recovery session, as the app does. */
async function openResetLink(email: string, emailNumber = 1) {
  const mail = await waitForEmail(email, emailNumber);
  const link = linkIn(mail);
  const landing = await followLink(link);
  return { link, landing };
}

async function recoveryClient(landing: URL) {
  const params = new URLSearchParams(landing.hash.slice(1));
  const client = anonClient();
  const { error } = await client.auth.setSession({
    access_token: params.get('access_token') ?? '',
    refresh_token: params.get('refresh_token') ?? '',
  });
  if (error) throw new Error(error.message);
  return client;
}

describe('OP5, OP6 Reset a forgotten password (US3)', () => {
  it('T-US3-1: a registered email gets the reset email; the answer is the same for any email', async () => {
    const user = await createUser('reset');
    expect(await requestPasswordReset(user.email, anonClient())).toEqual({ ok: true, data: undefined });
    const mail = await waitForEmail(user.email);
    expect(mail.Subject).toBe('Reset your Diabetes Companion SA password');

    const unknown = uniqueEmail('nobody');
    expect(await requestPasswordReset(unknown, anonClient())).toEqual({ ok: true, data: undefined });
    await sleep(1000);
    expect(await countEmails(unknown)).toBe(0);
  });

  it('T-US3-2: within 1 hour the link opens S4 step 2, and the new password works', async () => {
    const user = await createUser('newpass');
    await requestPasswordReset(user.email, anonClient(), S4_ADDRESS);
    const { landing } = await openResetLink(user.email);
    expect(landing.pathname).toBe('/forgot-password');
    expect(readAuthRedirect(landing.hash)).toEqual({ recovery: true, linkExpired: false });

    const client = await recoveryClient(landing);
    expect(await saveNewPassword('brandnew42', client)).toEqual({ ok: true, data: undefined });
    const { data } = await client.auth.getSession();
    expect(data.session).toBeNull();

    expect(await logIn(user.email, 'brandnew42', anonClient())).toEqual({ ok: true, data: undefined });
    expect(await logIn(user.email, user.password, anonClient())).toEqual({ ok: false, code: 'wrong_credentials' });
  });

  it('T-US3-3: a link that is no longer valid shows the expired-link state', async () => {
    const user = await createUser('expired');
    await requestPasswordReset(user.email, anonClient(), S4_ADDRESS);
    const { link } = await openResetLink(user.email);
    const secondTime = await followLink(link);
    expect(readAuthRedirect(secondTime.hash)).toEqual({ recovery: false, linkExpired: true });
  });

  it('T-US3-3: saving without a valid reset session gives "link_expired"', async () => {
    expect(await saveNewPassword('brandnew42', anonClient())).toEqual({ ok: false, code: 'link_expired' });
  });

  it('T-US3-4: two different passwords never reach the server', () => {
    expect(checkNewPassword('brandnew42', 'brandnew43')).toBe('mismatch');
    expect(checkNewPassword('short', 'short')).toBe('weak');
    expect(checkNewPassword('brandnew42', 'brandnew42')).toBeNull();
  });
});
