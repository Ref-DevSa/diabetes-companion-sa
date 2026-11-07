import { afterAll, describe, expect, it } from 'vitest';
import { isLoginAllowed, logIn } from '../../src/data/auth';
import { admin, anonClient, createUser, removeCreatedUsers, track, uniqueEmail } from '../helpers/supabaseTest';

afterAll(removeCreatedUsers);

async function failures(email: string) {
  const { count } = await admin.from('login_attempts').select('*', { count: 'exact', head: true }).eq('email', email);
  return count ?? 0;
}

describe('5 wrong tries, then a 15-minute wait (PRD Section 5)', () => {
  it('T-AUTH-5: five wrong passwords, then log-in is not allowed', async () => {
    const user = await createUser('five');
    for (let i = 0; i < 5; i += 1) await logIn(user.email, `nope${i}xx1`, anonClient());
    expect(await isLoginAllowed(user.email, anonClient())).toBe(false);
  });

  it('T-AUTH-5: a correct log-in clears the count', async () => {
    const user = await createUser('clear');
    for (let i = 0; i < 4; i += 1) await logIn(user.email, `nope${i}xx1`, anonClient());
    expect(await failures(user.email)).toBe(4);
    expect(await logIn(user.email, user.password, anonClient())).toEqual({ ok: true, data: undefined });
    expect(await failures(user.email)).toBe(0);
  });

  it('T-AUTH-5 / T-SEC-21b / T-SEC-22b: a Visitor cannot reset another email\'s count', async () => {
    const user = await createUser('protect');
    for (let i = 0; i < 5; i += 1) await logIn(user.email, `nope${i}xx1`, anonClient());
    const visitor = anonClient();
    const direct = await visitor.from('login_attempts').delete().eq('email', user.email);
    expect(direct.error).not.toBeNull();
    const viaFunction = await visitor.rpc('clear_my_login_attempts');
    expect(viaFunction.error).not.toBeNull();
    expect(await failures(user.email)).toBe(5);
  });

  it('T-INT-2: check_login_allowed and record_failed_login treat an unknown email the same way', async () => {
    const email = uniqueEmail('ghost');
    track(email);
    const client = anonClient();
    expect(await isLoginAllowed(email, client)).toBe(true);
    for (let i = 0; i < 5; i += 1) {
      expect(await logIn(email, 'whatever1', client)).toEqual({ ok: false, code: 'wrong_credentials' });
    }
    expect(await isLoginAllowed(email, client)).toBe(false);
    expect(await logIn(email, 'whatever1', client)).toEqual({ ok: false, code: 'too_many_tries' });
  });

  it('T-INT-2: capitals and spaces in the email do not get round the limit', async () => {
    const user = await createUser('caps');
    for (let i = 0; i < 5; i += 1) await logIn(` ${user.email.toUpperCase()} `, `nope${i}xx1`, anonClient());
    expect(await isLoginAllowed(user.email, anonClient())).toBe(false);
  });
});
