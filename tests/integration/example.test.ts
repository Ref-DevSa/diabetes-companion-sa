import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL ?? '';
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';

describe('T-SETUP-7: local Supabase answers', () => {
  it('T-SETUP-7: the environment points at the local Supabase', () => {
    expect(url, 'VITE_SUPABASE_URL in .env').toMatch(/^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
    expect(key, 'VITE_SUPABASE_PUBLISHABLE_KEY in .env').not.toBe('');
  });

  it('T-SETUP-7: the Auth health endpoint answers', async () => {
    const response = await fetch(`${url}/auth/v1/health`, { headers: { apikey: key } });
    expect(response.ok).toBe(true);
  });

  it('T-SETUP-7: a new client has no session', async () => {
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await client.auth.getSession();
    expect(error).toBeNull();
    expect(data.session).toBeNull();
  });
});
