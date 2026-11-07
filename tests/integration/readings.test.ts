import { afterAll, describe, expect, it } from 'vitest';
import { addReading, deleteReading, listReadings, updateReading, type ReadingInput } from '../../src/data/readings';
import { getFlag } from '../../src/lib/flag';
import { admin, anonClient, createUser, offlineFetch, removeCreatedUsers, signedInClient } from '../helpers/supabaseTest';

afterAll(removeCreatedUsers);

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

function input(fields: Partial<ReadingInput> = {}): ReadingInput {
  return { value: 6.8, when: 'fasting', takenAt: new Date(Date.now() - MINUTE).toISOString(), note: null, ...fields };
}

async function userClient(tag: string) {
  const user = await createUser(tag);
  return { user, client: await signedInClient(user.email) };
}

async function countFor(userId: string) {
  const { count } = await admin.from('readings').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  return count ?? 0;
}

describe('OP16 Add a Reading (US6, US7)', () => {
  it('T-US6-1: 6.8 Fasting with the default time is saved and comes back first in the Diary', async () => {
    const { client } = await userClient('add');
    const result = await addReading(input(), client);
    expect(result.ok).toBe(true);
    const list = await listReadings(0, client);
    expect(list.ok && list.data.readings[0]).toMatchObject({ value: 6.8, when: 'fasting', note: null });
    expect(result.ok && getFlag(result.data.value, result.data.when)).toBeNull();
  });

  it('T-US6-2: 45 is refused by the database and nothing is saved', async () => {
    const { user, client } = await userClient('big');
    expect((await addReading(input({ value: 45 }), client)).ok).toBe(false);
    expect((await addReading(input({ value: 6.85 }), client)).ok).toBe(false);
    expect(await countFor(user.id)).toBe(0);
  });

  it('T-US6-3: a missing When is refused by the database', async () => {
    const { user, client } = await userClient('nowhen');
    const result = await addReading({ ...input(), when: '' as never }, client);
    expect(result.ok).toBe(false);
    expect(await countFor(user.id)).toBe(0);
  });

  it('T-US6-4 / T-BR2-4: a time in the future is refused with "reading_future"', async () => {
    const { client } = await userClient('future');
    const result = await addReading(input({ takenAt: new Date(Date.now() + 10 * MINUTE).toISOString() }), client);
    expect(result).toEqual({ ok: false, code: 'reading_future' });
  });

  it('T-BR2-5: older than 30 days is refused with "reading_too_old"', async () => {
    const { client } = await userClient('old');
    const result = await addReading(input({ takenAt: new Date(Date.now() - 31 * DAY).toISOString() }), client);
    expect(result).toEqual({ ok: false, code: 'reading_too_old' });
  });

  it('T-US7-1 / T-US7-2 / T-US7-3: the saved Reading gets the right Flag (worked out, never stored)', async () => {
    const { client } = await userClient('flags');
    const low = await addReading(input({ value: 3.6, when: 'bedtime' }), client);
    const high = await addReading(input({ value: 14.6, when: 'fasting' }), client);
    const meal = await addReading(input({ value: 14.6, when: 'after_meal' }), client);
    expect(low.ok && getFlag(low.data.value, low.data.when)).toBe('low');
    expect(high.ok && getFlag(high.data.value, high.data.when)).toBe('very_high');
    expect(meal.ok && getFlag(meal.data.value, meal.data.when)).toBeNull();
    const { data } = await admin.from('readings').select('*').limit(1);
    expect(Object.keys(data?.[0] ?? {})).not.toContain('flag');
  });

  it('T-BR9-2: the 31st Reading saved today is refused with "daily_limit"', async () => {
    const { user, client } = await userClient('limit');
    const rows = Array.from({ length: 30 }, () => ({ user_id: user.id, value: 5, reading_when: 'other' }));
    await admin.from('readings').insert(rows);
    expect(await addReading(input(), client)).toEqual({ ok: false, code: 'daily_limit' });
  });

  it('T-BR9-2: the day is the day it is saved, not the date of the Reading', async () => {
    const { user, client } = await userClient('limitday');
    const yesterday = new Date(Date.now() - DAY).toISOString();
    const rows = Array.from({ length: 30 }, () => ({ user_id: user.id, value: 5, reading_when: 'other', taken_at: yesterday, created_at: yesterday }));
    await admin.from('readings').insert(rows);
    expect((await addReading(input({ takenAt: yesterday }), client)).ok).toBe(true);
  });

  it('BR23: when the connection drops after logging in, the result is "offline" and nothing is saved', async () => {
    const user = await createUser('offline');
    let connected = true;
    const client = anonClient({ fetch: (...args) => (connected ? fetch(...args) : offlineFetch(...args)) });
    await client.auth.signInWithPassword({ email: user.email, password: user.password });
    connected = false;
    expect(await addReading(input(), client)).toEqual({ ok: false, code: 'offline' });
    expect(await countFor(user.id)).toBe(0);
  });
});

describe('OP15 List Readings (US8, BR7)', () => {
  it('T-US8-1 / T-BR7-1: newest first by date and time, 20 at a time, then the rest', async () => {
    const { user, client } = await userClient('list');
    const now = Date.now();
    const rows = Array.from({ length: 25 }, (_, i) => ({
      user_id: user.id,
      value: 5 + i / 10,
      reading_when: 'other',
      taken_at: new Date(now - (i + 1) * 60 * MINUTE).toISOString(),
      created_at: new Date(now - 2 * DAY).toISOString(),
    }));
    // Insert in shuffled order: the Diary must sort by date and time, not by when rows were added.
    await admin.from('readings').insert([...rows].reverse());
    const first = await listReadings(0, client);
    expect(first.ok && first.data.readings).toHaveLength(20);
    expect(first.ok && first.data.hasMore).toBe(true);
    expect(first.ok && first.data.readings.map((r) => r.value)).toEqual(rows.slice(0, 20).map((r) => r.value));
    const rest = await listReadings(20, client);
    expect(rest.ok && rest.data.readings.map((r) => r.value)).toEqual(rows.slice(20).map((r) => r.value));
    expect(rest.ok && rest.data.hasMore).toBe(false);
  });

  it('T-US8-4: a User with no Readings gets an empty Diary', async () => {
    const { client } = await userClient('empty');
    expect(await listReadings(0, client)).toEqual({ ok: true, data: { readings: [], hasMore: false } });
  });
});

describe('OP17, OP18 Edit and delete (US8, BR8)', () => {
  it('T-US8-2 / T-US7-4: editing 3.6 to 5.2 saves the new value and the Flag goes', async () => {
    const { client } = await userClient('edit');
    const added = await addReading(input({ value: 3.6, when: 'bedtime' }), client);
    if (!added.ok) throw new Error('setup');
    const result = await updateReading(added.data.id, { ...input({ value: 5.2, when: 'bedtime' }), takenAt: added.data.takenAt }, client);
    expect(result.ok && result.data.value).toBe(5.2);
    expect(result.ok && getFlag(result.data.value, result.data.when)).toBeNull();
  });

  it('T-US8-3: deleting removes the Reading', async () => {
    const { user, client } = await userClient('delete');
    const added = await addReading(input(), client);
    if (!added.ok) throw new Error('setup');
    expect(await deleteReading(added.data.id, client)).toEqual({ ok: true, data: undefined });
    expect(await countFor(user.id)).toBe(0);
  });

  it('T-BR8-1: a User can edit and delete their own old Readings at any time', async () => {
    const { user, client } = await userClient('oldedit');
    const takenAt = new Date(Date.now() - 29 * DAY - 23 * 60 * MINUTE).toISOString();
    const { data } = await admin.from('readings').insert({ user_id: user.id, value: 7.2, reading_when: 'before_meal', taken_at: takenAt }).select('id').single();
    const id = data?.id as string;
    const edited = await updateReading(id, { value: 7.4, when: 'before_meal', takenAt, note: 'After lunch' }, client);
    expect(edited.ok && edited.data).toMatchObject({ value: 7.4, note: 'After lunch' });
    expect(await deleteReading(id, client)).toEqual({ ok: true, data: undefined });
  });

  it('T-EDGE-4: editing a Reading deleted on another phone gives "not_found"', async () => {
    const { client } = await userClient('gone');
    const added = await addReading(input(), client);
    if (!added.ok) throw new Error('setup');
    await admin.from('readings').delete().eq('id', added.data.id);
    expect(await updateReading(added.data.id, input(), client)).toEqual({ ok: false, code: 'not_found' });
  });
});

describe('T-INT-7: another User\'s Reading cannot be touched through the operations', () => {
  it('T-INT-7: not listed, not editable, not deletable', async () => {
    const owner = await userClient('owner');
    const stranger = await userClient('stranger');
    const added = await addReading(input({ value: 9.4, when: 'after_meal' }), owner.client);
    if (!added.ok) throw new Error('setup');
    const theirList = await listReadings(0, stranger.client);
    expect(theirList.ok && theirList.data.readings).toEqual([]);
    expect(await updateReading(added.data.id, input({ value: 1.0 }), stranger.client)).toEqual({ ok: false, code: 'not_found' });
    expect(await deleteReading(added.data.id, stranger.client)).toEqual({ ok: false, code: 'not_found' });
    const { data } = await admin.from('readings').select('value').eq('id', added.data.id).single();
    expect(data?.value).toBe(9.4);
  });
});
