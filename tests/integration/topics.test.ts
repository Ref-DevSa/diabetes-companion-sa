import { afterAll, describe, expect, it } from 'vitest';
import { listSafetyItems, listTopics } from '../../src/data/content';
import { admin, anonClient, createUser, offlineFetch, removeCreatedUsers, signedInClient } from '../helpers/supabaseTest';

const extraSlugs: string[] = [];

afterAll(async () => {
  if (extraSlugs.length > 0) await admin.from('topics').delete().in('slug', extraSlugs);
  await removeCreatedUsers();
});

/** Adds a Topic as the admin would in the dashboard; removed after the tests. */
async function addTopic(fields: Record<string, unknown>) {
  const slug = `it-${Math.random().toString(36).slice(2, 10)}`;
  extraSlugs.push(slug);
  const { error } = await admin.from('topics').insert({
    slug,
    title_en: 'English title',
    summary_en: 'English summary',
    body_en: 'English body',
    reading_minutes: 2,
    sort_order: 90,
    ...fields,
  });
  if (error) throw new Error(error.message);
  return slug;
}

const serverErrorFetch: typeof fetch = async () =>
  new Response(JSON.stringify({ message: 'Internal error' }), { status: 500, headers: { 'content-type': 'application/json' } });

describe('OP11 List Topics (US11)', () => {
  it('T-US11-1: a Visitor gets the six published Topics, in order, with their full text', async () => {
    const result = await listTopics('en', anonClient());
    expect(result.ok).toBe(true);
    const topics = result.ok ? result.data.filter((t) => !t.slug.startsWith('it-')) : [];
    expect(topics.map((t) => t.title)).toEqual([
      'What is diabetes?',
      'Type 2 diabetes basics',
      'Eating well',
      'Moving more',
      'Check-ups and complications',
      'Supporting someone with diabetes',
    ]);
    expect(topics[0]).toMatchObject({ slug: 'what-is-diabetes', summary: 'The basics in plain words', readingMinutes: 3 });
    expect(topics[0]?.body).toContain('DRAFT: NOT REVIEWED');
    expect(topics[0]?.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('T-US11-1: a logged-in User gets the same Topics', async () => {
    const user = await createUser('topics');
    const result = await listTopics('en', await signedInClient(user.email));
    expect(result.ok && result.data.length).toBeGreaterThanOrEqual(6);
  });

  it('T-US11-2: with reviewed Setswana text, the Topic shows in Setswana', async () => {
    const slug = await addTopic({
      title_tn: 'Setlhogo sa teko',
      summary_tn: 'Kakaretso ya teko',
      body_tn: 'Mmele wa teko',
      tn_reviewed_at: '2026-11-01',
      is_published: true,
      reviewed_at: '2026-11-01',
      reviewed_by: 'TEST DATA (not reviewed)',
    });
    const result = await listTopics('tn', anonClient());
    const topic = result.ok ? result.data.find((t) => t.slug === slug) : undefined;
    expect(topic).toMatchObject({ title: 'Setlhogo sa teko', summary: 'Kakaretso ya teko', body: 'Mmele wa teko' });
  });

  it('T-INT-6: a missing translation falls back to English field by field', async () => {
    const slug = await addTopic({
      title_zu: 'Isihloko sokuhlola',
      zu_reviewed_at: '2026-11-01',
      is_published: true,
      reviewed_at: '2026-11-01',
      reviewed_by: 'TEST DATA (not reviewed)',
    });
    const result = await listTopics('zu', anonClient());
    const topic = result.ok ? result.data.find((t) => t.slug === slug) : undefined;
    expect(topic).toMatchObject({ title: 'Isihloko sokuhlola', summary: 'English summary', body: 'English body' });
  });

  it('T-BR22-2: unpublished Topics are never returned to a Visitor', async () => {
    const slug = await addTopic({});
    const result = await listTopics('en', anonClient());
    expect(result.ok && result.data.some((t) => t.slug === slug)).toBe(false);
  });

  it('T-BR22-2: reviewed_by is never returned and cannot be read', async () => {
    const result = await listTopics('en', anonClient());
    expect(result.ok && result.data.every((t) => !('reviewedBy' in t) && !('reviewed_by' in t))).toBe(true);
    const direct = await anonClient().from('topics').select('reviewed_by');
    expect(direct.error).not.toBeNull();
  });

  it('T-US11-3: with no internet the result is "offline"', async () => {
    expect(await listTopics('en', anonClient({ fetch: offlineFetch }))).toEqual({ ok: false, code: 'offline' });
  });

  it('T-US11-4: a server failure gives "server"', async () => {
    expect(await listTopics('en', anonClient({ fetch: serverErrorFetch }))).toEqual({ ok: false, code: 'server' });
  });
});

describe('OP12 List Safety Guide items (US13)', () => {
  it('T-US13-2: the published lists come back in order for each section', async () => {
    const result = await listSafetyItems('en', anonClient());
    expect(result.ok).toBe(true);
    const items = result.ok ? result.data : [];
    expect(items.filter((i) => i.section === 'low').map((i) => i.text)).toEqual([
      'Shaking or feeling jittery',
      'Sweating',
      'Sudden hunger',
      'Feeling dizzy or confused',
      'A fast heartbeat',
    ]);
    expect(items.filter((i) => i.section === 'high')).toHaveLength(5);
    expect(items.filter((i) => i.section === 'urgent').at(-1)?.text).toBe('You are not sure. It is always safer to call');
  });

  it('T-US13-3: with no internet the result is "offline"', async () => {
    expect(await listSafetyItems('en', anonClient({ fetch: offlineFetch }))).toEqual({ ok: false, code: 'offline' });
  });

  it('T-INT-6: Safety Guide text falls back to English when the language has none', async () => {
    const result = await listSafetyItems('zu', anonClient());
    expect(result.ok && result.data[0]?.text).toBe('Shaking or feeling jittery');
  });
});
