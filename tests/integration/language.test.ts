import { afterAll, describe, expect, it } from 'vitest';
import { getProfile, setLanguage } from '../../src/data/profile';
import { appLanguageFor } from '../../src/i18n/languages';
import { pickText } from '../../src/lib/pickText';
import { anonClient, createUser, removeCreatedUsers, signedInClient } from '../helpers/supabaseTest';

afterAll(removeCreatedUsers);

describe('OP9 Change language (US4)', () => {
  it('T-US4-1: choosing isiZulu saves it to the account', async () => {
    const user = await createUser('zulu');
    const client = await signedInClient(user.email);
    expect(await setLanguage('zu', client)).toEqual({ ok: true, data: undefined });
    const profile = await getProfile(client);
    expect(profile.ok && profile.data.language).toBe('zu');
  });

  it('T-US4-2: after choosing Setswana, logging in on another phone opens the app in Setswana', async () => {
    const user = await createUser('tswana');
    await setLanguage('tn', await signedInClient(user.email));
    const otherPhone = await signedInClient(user.email);
    const profile = await getProfile(otherPhone);
    expect(profile.ok && profile.data.language).toBe('tn');
    // With all three languages switched on (test configuration) the app uses it ...
    expect(appLanguageFor(profile.ok ? profile.data.language : 'en', ['en', 'zu', 'tn'])).toBe('tn');
    // ... and until Setswana is reviewed (BR21) the app stays in English.
    expect(appLanguageFor('tn', ['en'])).toBe('en');
  });

  it('T-US4-3: a Topic with no isiZulu text shows the English text', async () => {
    const { data, error } = await anonClient()
      .from('topics')
      .select('slug, title_en, title_zu, title_tn, body_en, body_zu, body_tn')
      .eq('slug', 'what-is-diabetes')
      .single();
    expect(error).toBeNull();
    expect(data?.title_zu).toBeNull();
    expect(pickText(data as Record<string, string | null>, 'title', 'zu')).toBe('What is diabetes?');
    expect(pickText(data as Record<string, string | null>, 'body', 'zu')).toBe(data?.body_en);
  });

  it('T-US4-1: a Visitor cannot save a language to any account', async () => {
    expect(await setLanguage('zu', anonClient())).toEqual({ ok: false, code: 'server' });
  });
});
