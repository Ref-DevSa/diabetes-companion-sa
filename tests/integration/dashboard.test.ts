import { afterAll, describe, expect, it } from 'vitest';
import { getTodayChecklist, tickItem } from '../../src/data/checklist';
import { getDashboard } from '../../src/data/dashboard';
import { admin, anonClient, createUser, removeCreatedUsers, signedInClient } from '../helpers/supabaseTest';

afterAll(removeCreatedUsers);

const HOUR = 60 * 60 * 1000;

const serverErrorFetch: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.includes('/rest/v1/')) {
    return new Response(JSON.stringify({ message: 'Internal error' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
  return fetch(input, init);
};

async function userClient(tag: string) {
  const user = await createUser(tag);
  return { user, client: await signedInClient(user.email) };
}

/** n Readings for a User, one an hour apart, the newest an hour ago; values 5.0, 5.1, ... newest first. */
async function addReadings(userId: string, n: number) {
  const now = Date.now();
  const rows = Array.from({ length: n }, (_, i) => ({
    user_id: userId,
    value: Number((5 + i / 10).toFixed(1)),
    reading_when: i === 1 ? 'bedtime' : 'other',
    taken_at: new Date(now - (i + 1) * HOUR).toISOString(),
  }));
  rows[1]!.value = 3.6;
  const { error } = await admin.from('readings').insert(rows);
  if (error) throw new Error(error.message);
}

describe('OP19 Get Dashboard data (US12)', () => {
  it('T-US12-1: with 10 Readings and 3 of 4 Items ticked: the 7 newest Readings, newest first, and "3 of 4 done"', async () => {
    const { user, client } = await userClient('dash');
    await addReadings(user.id, 10);
    const list = await getTodayChecklist(client);
    if (!list.ok) throw new Error('setup');
    for (const item of list.data.items.slice(0, 3)) await tickItem(item.id, client);

    const result = await getDashboard(client);
    if (!result.ok) throw new Error(result.code);
    expect(result.data.readings.map((r) => r.value)).toEqual([5.0, 3.6, 5.2, 5.3, 5.4, 5.5, 5.6]);
    expect(result.data.readings[1]).toMatchObject({ value: 3.6, when: 'bedtime' });
    expect(result.data.progress).toEqual({ done: 3, total: 4, allDone: false });
  });

  it('T-US12-2: with no Readings: an empty list, and the Checklist progress still comes back', async () => {
    const { client } = await userClient('dashempty');
    const result = await getDashboard(client);
    expect(result).toEqual({ ok: true, data: { readings: [], progress: { done: 0, total: 4, allDone: false } } });
  });

  it('T-US12-3: when the server fails: "server"', async () => {
    const user = await createUser('dasherror');
    const client = anonClient({ fetch: serverErrorFetch });
    await client.auth.signInWithPassword({ email: user.email, password: user.password });
    expect(await getDashboard(client)).toEqual({ ok: false, code: 'server' });
  });

  it("T-INT-8: only the caller's own Readings and ticks are returned", async () => {
    const other = await userClient('dashother');
    await addReadings(other.user.id, 3);
    const otherList = await getTodayChecklist(other.client);
    if (!otherList.ok) throw new Error('setup');
    await tickItem(otherList.data.items[0]!.id, other.client);

    const me = await userClient('dashme');
    await addReadings(me.user.id, 2);
    const result = await getDashboard(me.client);
    if (!result.ok) throw new Error(result.code);
    expect(result.data.readings).toHaveLength(2);
    expect(result.data.progress).toEqual({ done: 0, total: 4, allDone: false });
  });
});
