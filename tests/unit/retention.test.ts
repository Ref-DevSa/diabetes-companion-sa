import { describe, expect, it } from 'vitest';
import { appSources, filesUnder, withText } from '../helpers/sourceFiles';

describe('T-BR25-2: accounts are never deleted or hidden for being inactive (BR25)', () => {
  const sources = [
    ...appSources(),
    ...withText(filesUnder('supabase/migrations', ['.sql'])),
    ...withText(filesUnder('scripts', ['.mjs', '.js', '.ts'])),
  ];

  it('T-BR25-2: no code mentions inactivity, scheduled jobs or "last seen" clean-up', () => {
    const pattern = /inactiv|dormant|pg_cron|cron\.schedule|last_seen|purge|expire_accounts|is_active\s*=\s*false/i;
    expect(sources.filter(({ text }) => pattern.test(text)).map(({ path }) => path)).toEqual([]);
  });

  it('T-BR25-2: nothing deletes users based on how long ago they signed in', () => {
    const pattern = /last_sign_in_at[^;]*(delete|interval)|delete[^;]*last_sign_in_at/is;
    expect(sources.filter(({ text }) => pattern.test(text)).map(({ path }) => path)).toEqual([]);
  });
});
