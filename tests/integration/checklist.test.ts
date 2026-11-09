import { afterAll, describe, expect, it } from 'vitest';
import {
  addCustomItem,
  deleteCustomItem,
  getTodayChecklist,
  renameCustomItem,
  tickItem,
  untickItem,
} from '../../src/data/checklist';
import { checklistProgress } from '../../src/lib/checklistRules';
import { sastToday } from '../../src/lib/dates';
import { admin, anonClient, createUser, offlineFetch, removeCreatedUsers, signedInClient } from '../helpers/supabaseTest';

afterAll(removeCreatedUsers);

async function userClient(tag: string) {
  const user = await createUser(tag);
  return { user, client: await signedInClient(user.email) };
}

async function today(client: Awaited<ReturnType<typeof signedInClient>>) {
  const result = await getTodayChecklist(client);
  if (!result.ok) throw new Error(`getTodayChecklist: ${result.code}`);
  return result.data;
}

function idOf(list: Awaited<ReturnType<typeof today>>, key: string) {
  return list.items.find((item) => item.standardKey === key)?.id as string;
}

describe('OP20 to OP22: today\'s Checklist and ticks (US9)', () => {
  it('T-US9-1: a new User sees the four Standard Items unticked; ticking "Drink water" gives "1 of 4 done"', async () => {
    const { client } = await userClient('tick');
    const list = await today(client);
    expect(list.date).toBe(sastToday());
    expect(list.items.map((item) => item.standardKey)).toEqual(['medication', 'glucose_check', 'water', 'activity']);
    expect(list.tickedIds).toEqual([]);
    expect(await tickItem(idOf(list, 'water'), client)).toEqual({ ok: true, data: undefined });
    const after = await today(client);
    expect(after.tickedIds).toEqual([idOf(list, 'water')]);
    expect(checklistProgress(after.items.map((i) => i.id), after.tickedIds)).toMatchObject({ done: 1, total: 4 });
  });

  it('T-US9-2: ticking all four gives "All done today"', async () => {
    const { client } = await userClient('alldone');
    const list = await today(client);
    for (const item of list.items) await tickItem(item.id, client);
    const after = await today(client);
    expect(checklistProgress(after.items.map((i) => i.id), after.tickedIds).allDone).toBe(true);
  });

  it('T-US9-2: ticking the same Item twice is harmless (one tick per day)', async () => {
    const { client } = await userClient('twice');
    const list = await today(client);
    await tickItem(idOf(list, 'water'), client);
    expect(await tickItem(idOf(list, 'water'), client)).toEqual({ ok: true, data: undefined });
    expect((await today(client)).tickedIds).toHaveLength(1);
  });

  it('T-US9-3: when the connection drops after logging in, ticking gives "offline" and nothing is saved', async () => {
    const user = await createUser('offline');
    let connected = true;
    const client = anonClient({ fetch: (...args) => (connected ? fetch(...args) : offlineFetch(...args)) });
    await client.auth.signInWithPassword({ email: user.email, password: user.password });
    const list = await today(client);
    connected = false;
    expect(await tickItem(idOf(list, 'water'), client)).toEqual({ ok: false, code: 'offline' });
    const { count } = await admin.from('checklist_ticks').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    expect(count).toBe(0);
  });

  it('T-US9-4: ticks from an earlier day are kept but not shown today', async () => {
    const { user, client } = await userClient('newday');
    const list = await today(client);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await admin.from('checklist_ticks').insert({ user_id: user.id, item_id: idOf(list, 'medication'), tick_date: yesterday });
    expect((await today(client)).tickedIds).toEqual([]);
    const { count } = await admin.from('checklist_ticks').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    expect(count).toBe(1);
  });

  it('T-INT-4: unticking removes today\'s tick; yesterday\'s tick cannot be changed', async () => {
    const { user, client } = await userClient('untick');
    const list = await today(client);
    const medication = idOf(list, 'medication');
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await admin.from('checklist_ticks').insert({ user_id: user.id, item_id: medication, tick_date: yesterday });
    await tickItem(medication, client);
    expect(await untickItem(medication, client)).toEqual({ ok: true, data: undefined });
    expect((await today(client)).tickedIds).toEqual([]);
    await client.from('checklist_ticks').delete().eq('item_id', medication);
    const { data } = await admin.from('checklist_ticks').select('tick_date').eq('user_id', user.id);
    expect(data).toEqual([{ tick_date: yesterday }]);
  });
});

describe('OP23 to OP25: Custom Items (US10)', () => {
  it('T-US10-1: "Evening walk" is added after the four Standard Items: "0 of 5 done"', async () => {
    const { client } = await userClient('custom');
    const added = await addCustomItem('Evening walk', client);
    expect(added.ok && added.data).toMatchObject({ isStandard: false, standardKey: null, name: 'Evening walk' });
    const list = await today(client);
    expect(list.items.map((item) => item.name)).toEqual([
      'Take my medication as prescribed',
      'Check my glucose if my care plan says so',
      'Drink water',
      'Do suitable physical activity',
      'Evening walk',
    ]);
    expect(checklistProgress(list.items.map((i) => i.id), list.tickedIds)).toMatchObject({ done: 0, total: 5 });
  });

  it('T-US10-1: Custom Items stay in the order they were added (oldest first)', async () => {
    const { client } = await userClient('order');
    for (const name of ['First', 'Second', 'Third']) await addCustomItem(name, client);
    expect((await today(client)).items.slice(4).map((item) => item.name)).toEqual(['First', 'Second', 'Third']);
  });

  it('T-US10-2 / T-BR11-1: "evening walk" when "Evening walk" exists gives "item_name_taken"', async () => {
    const { client } = await userClient('dupe');
    await addCustomItem('Evening walk', client);
    expect(await addCustomItem('evening walk', client)).toEqual({ ok: false, code: 'item_name_taken' });
  });

  it('T-BR11-1: a name over 60 characters is refused by the database', async () => {
    const { client } = await userClient('long');
    expect((await addCustomItem('a'.repeat(61), client)).ok).toBe(false);
  });

  it('T-US10-3 / T-BR11-2: the 7th Custom Item gives "custom_item_limit"', async () => {
    const { client } = await userClient('seven');
    for (let i = 1; i <= 6; i += 1) expect((await addCustomItem(`Item ${i}`, client)).ok).toBe(true);
    expect(await addCustomItem('Item 7', client)).toEqual({ ok: false, code: 'custom_item_limit' });
  });

  it('T-US10-4: a Custom Item can be renamed', async () => {
    const { client } = await userClient('rename');
    const added = await addCustomItem('Evening walk', client);
    if (!added.ok) throw new Error('setup');
    const renamed = await renameCustomItem(added.data.id, 'Evening walk 20 min', client);
    expect(renamed.ok && renamed.data.name).toBe('Evening walk 20 min');
  });

  it('T-US10-4 / T-BR11-4: deleting a Custom Item deletes it and its ticks', async () => {
    const { user, client } = await userClient('remove');
    const added = await addCustomItem('Evening walk', client);
    if (!added.ok) throw new Error('setup');
    await tickItem(added.data.id, client);
    expect(await deleteCustomItem(added.data.id, client)).toEqual({ ok: true, data: undefined });
    const list = await today(client);
    expect(list.items).toHaveLength(4);
    const { count } = await admin.from('checklist_ticks').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    expect(count).toBe(0);
  });

  it('SEC10 / SEC11: another User\'s Custom Item cannot be renamed or deleted through the operations', async () => {
    const owner = await userClient('itemowner');
    const stranger = await userClient('itemstranger');
    const added = await addCustomItem('Evening walk', owner.client);
    if (!added.ok) throw new Error('setup');
    expect(await renameCustomItem(added.data.id, 'Hacked', stranger.client)).toEqual({ ok: false, code: 'not_found' });
    expect(await deleteCustomItem(added.data.id, stranger.client)).toEqual({ ok: false, code: 'not_found' });
    const { data } = await admin.from('checklist_items').select('name').eq('id', added.data.id).single();
    expect(data?.name).toBe('Evening walk');
  });
});
