import { afterAll, describe, expect, it } from 'vitest';
import { logIn, logOut } from '../../src/data/auth';
import { deleteMyAccount } from '../../src/data/profile';
import { admin, anonClient, createUser, findAuthUser, offlineFetch, removeCreatedUsers, signedInClient } from '../helpers/supabaseTest';

afterAll(removeCreatedUsers);

async function rowsFor(userId: string) {
  const count = async (table: 'users' | 'readings' | 'checklist_items' | 'checklist_ticks', column: string) => {
    const { count: n } = await admin.from(table).select('*', { count: 'exact', head: true }).eq(column, userId);
    return n ?? 0;
  };
  return {
    users: await count('users', 'id'),
    readings: await count('readings', 'user_id'),
    items: await count('checklist_items', 'user_id'),
    ticks: await count('checklist_ticks', 'user_id'),
  };
}

async function userWithData(tag: string) {
  const user = await createUser(tag);
  await admin.from('readings').insert({ user_id: user.id, value: 6.8, reading_when: 'fasting' });
  const { data: item } = await admin.from('checklist_items').insert({ user_id: user.id, name: 'Evening walk' }).select('id').single();
  await admin.from('checklist_ticks').insert({ user_id: user.id, item_id: item?.id });
  return user;
}

describe('OP7 Log out and OP10 Delete my account (US5)', () => {
  it('T-US5-1: log out ends the session', async () => {
    const user = await createUser('logout');
    const client = await signedInClient(user.email);
    expect(await logOut(client)).toEqual({ ok: true, data: undefined });
    const { data } = await client.auth.getSession();
    expect(data.session).toBeNull();
  });

  it('T-US5-2 / T-BR20-1: deleting the account removes it and all its data; the old details no longer work', async () => {
    const user = await userWithData('delete');
    expect(await rowsFor(user.id)).toEqual({ users: 1, readings: 1, items: 1, ticks: 1 });
    const client = await signedInClient(user.email);
    expect(await deleteMyAccount(client)).toEqual({ ok: true, data: undefined });
    expect(await rowsFor(user.id)).toEqual({ users: 0, readings: 0, items: 0, ticks: 0 });
    expect(await findAuthUser(user.email)).toBeNull();
    expect(await logIn(user.email, user.password, anonClient())).toEqual({ ok: false, code: 'wrong_credentials' });
  });

  it('T-US5-3: nothing is deleted unless the User confirms (no call, no change)', async () => {
    const user = await userWithData('cancel');
    await signedInClient(user.email);
    expect(await rowsFor(user.id)).toEqual({ users: 1, readings: 1, items: 1, ticks: 1 });
  });

  it('T-US5-4: offline, deleting fails with "offline" and nothing is deleted', async () => {
    const user = await userWithData('offline');
    const client = await signedInClient(user.email);
    const { data } = await client.auth.getSession();
    const offlineClient = anonClient({ fetch: offlineFetch });
    await offlineClient.auth.setSession({
      access_token: data.session?.access_token ?? '',
      refresh_token: data.session?.refresh_token ?? '',
    }).catch(() => undefined);
    expect(await deleteMyAccount(offlineClient)).toEqual({ ok: false, code: 'offline' });
    expect(await rowsFor(user.id)).toEqual({ users: 1, readings: 1, items: 1, ticks: 1 });
  });

  it('T-INT-5: a Visitor (no session) cannot call delete_my_account', async () => {
    const user = await userWithData('visitor');
    const result = await deleteMyAccount(anonClient());
    expect(result.ok).toBe(false);
    expect(await rowsFor(user.id)).toEqual({ users: 1, readings: 1, items: 1, ticks: 1 });
  });
});
