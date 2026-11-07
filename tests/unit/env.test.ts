import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('T-SETUP-3: environment variables (Section 6)', () => {
  it('T-SETUP-3: .env.example lists every variable with placeholder values', () => {
    const example = readFileSync('.env.example', 'utf8');
    for (const name of [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'TEST_USER_PASSWORD',
      'E2E_BASE_URL',
    ]) {
      expect(example).toMatch(new RegExp('^' + name + '=', 'm'));
    }
    expect(example).toContain('BREVO_SMTP_KEY is NOT stored here');
    expect(example).not.toMatch(/^BREVO_SMTP_KEY=/m);
  });

  it('T-SETUP-3: .gitignore keeps .env files out of Git', () => {
    const lines = readFileSync('.gitignore', 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim());
    for (const entry of ['.env', '.env.*', 'node_modules', 'dist', 'supabase/.temp']) {
      expect(lines).toContain(entry);
    }
  });
});
