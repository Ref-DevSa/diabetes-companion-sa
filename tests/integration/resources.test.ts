import { afterAll, describe, expect, it } from 'vitest';
import { listFamilyTips, listResources } from '../../src/data/content';
import { admin, anonClient, offlineFetch } from '../helpers/supabaseTest';

const extraNames: string[] = [];
const extraTips: string[] = [];

afterAll(async () => {
  if (extraNames.length > 0) await admin.from('resources').delete().in('name', extraNames);
  if (extraTips.length > 0) await admin.from('family_tips').delete().in('text_en', extraTips);
});

describe('OP14 List Resources (US14)', () => {
  it('T-US14-1: a Visitor gets the three published Resources in order, with their https links', async () => {
    const result = await listResources('en', anonClient());
    if (!result.ok) throw new Error(result.code);
    expect(result.data.map(({ name, url }) => ({ name, url }))).toEqual([
      { name: 'Diabetes South Africa', url: 'https://www.diabetessa.org.za' },
      { name: 'SEMDSA', url: 'https://www.semdsa.org.za' },
      { name: 'National Department of Health', url: 'https://www.health.gov.za' },
    ]);
    expect(result.data[2]!.description).toBe('Public health services, clinic information and health campaigns');
  });

  it('SEC19 / BR19: an unpublished Resource is not returned', async () => {
    const name = `IT draft ${Math.random().toString(36).slice(2, 8)}`;
    extraNames.push(name);
    const { error } = await admin.from('resources').insert({ name, description_en: 'Draft', url: 'https://example.org', sort_order: 99 });
    if (error) throw new Error(error.message);
    const result = await listResources('en', anonClient());
    expect(result.ok && result.data.some((r) => r.name === name)).toBe(false);
  });

  it('BR17: a missing translation shows the English text', async () => {
    const result = await listResources('zu', anonClient());
    expect(result.ok && result.data[0]!.description).toBe('A non-profit that supports and speaks up for people with diabetes in South Africa');
  });

  it('BR23: with no internet: "offline"', async () => {
    expect(await listResources('en', anonClient({ fetch: offlineFetch }))).toEqual({ ok: false, code: 'offline' });
  });
});

describe('OP13 List Family tips (US14)', () => {
  it('T-US14-2: a Visitor gets the five published tips in order', async () => {
    const result = await listFamilyTips('en', anonClient());
    if (!result.ok) throw new Error(result.code);
    expect(result.data.map((tip) => tip.text)).toEqual([
      'Learn the signs of low and high blood sugar so you can spot them early.',
      'Ask how you can help instead of taking over.',
      'Offer to go to clinic visits if they would like company.',
      'Plan meals together and keep healthy snacks at home.',
      'Know the emergency numbers: 112 from a cell phone and 10177 for an ambulance.',
    ]);
  });

  it('SEC18 / BR19: an unpublished tip is not returned', async () => {
    const text = `IT draft tip ${Math.random().toString(36).slice(2, 8)}`;
    extraTips.push(text);
    const { error } = await admin.from('family_tips').insert({ text_en: text, sort_order: 99 });
    if (error) throw new Error(error.message);
    const result = await listFamilyTips('en', anonClient());
    expect(result.ok && result.data.some((tip) => tip.text === text)).toBe(false);
  });

  it('BR23: with no internet: "offline"', async () => {
    expect(await listFamilyTips('en', anonClient({ fetch: offlineFetch }))).toEqual({ ok: false, code: 'offline' });
  });
});
