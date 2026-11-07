import { afterAll, describe, expect, it } from 'vitest';
import { getProfile } from '../../src/data/profile';
import { anonClient, createUser, offlineFetch, removeCreatedUsers, signedInClient } from '../helpers/supabaseTest';

afterAll(removeCreatedUsers);

describe('OP8 Get my profile', () => {
  it('T-INT-3: a User reads only their own profile', async () => {
    const alice = await createUser('alice');
    await createUser('bob');
    const client = await signedInClient(alice.email);
    const result = await getProfile(client);
    expect(result).toEqual({ ok: true, data: { id: alice.id, email: alice.email, language: 'en' } });
    const { data } = await client.from('users').select('id');
    expect(data).toEqual([{ id: alice.id }]);
  });

  it('T-INT-3: a Visitor has no profile', async () => {
    expect((await getProfile(anonClient())).ok).toBe(false);
  });

  it('T-INT-3: no internet gives "offline"', async () => {
    expect(await getProfile(anonClient({ fetch: offlineFetch }))).toEqual({ ok: false, code: 'offline' });
  });
});
