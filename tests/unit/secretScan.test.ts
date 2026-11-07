import { afterAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const tempDir = mkdtempSync(join(tmpdir(), 'dcsa-scan-'));

function scan(args: string[]) {
  return spawnSync(process.execPath, ['scripts/scan-secrets.mjs', ...args], { encoding: 'utf8' });
}

afterAll(() => rmSync(tempDir, { recursive: true, force: true }));

describe('T-SETUP-9: secret scan', () => {
  it('T-SETUP-9: fails when a file contains a Supabase secret key', () => {
    const file = join(tempDir, 'leak.ts');
    // Built at run time so this test file itself never contains a key.
    writeFileSync(file, `const key = '${'sb_' + 'secret_' + 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4'}';\n`);
    const result = scan([file]);
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('leak.ts');
  });

  it('T-SETUP-9: fails when a file contains a JWT-style service key', () => {
    const file = join(tempDir, 'jwt.txt');
    const part = (text: string) => Buffer.from(text).toString('base64url');
    const jwt = [part('{"alg":"HS256","typ":"JWT"}'), part('{"role":"service_role"}'), 'c2lnbmF0dXJlLXNpZ25hdHVyZQ'].join('.');
    writeFileSync(file, `SUPABASE_SERVICE_ROLE_KEY=${jwt}\n`);
    expect(scan([file]).status).toBe(1);
  });

  it('T-SETUP-9: fails when a file contains a Brevo SMTP key', () => {
    const file = join(tempDir, 'brevo.txt');
    writeFileSync(file, `${'xsmtp' + 'sib-'}${'a'.repeat(64)}-AbCdEfGh12345678\n`);
    expect(scan([file]).status).toBe(1);
  });

  it('T-SETUP-9: passes on a clean file', () => {
    const file = join(tempDir, 'clean.ts');
    writeFileSync(file, "export const greeting = 'Sawubona';\n");
    expect(scan([file]).status).toBe(0);
  });

  it('T-SETUP-9: passes on the clean repository', () => {
    const result = scan([]);
    expect(result.stdout + result.stderr).not.toContain('Possible secret');
    expect(result.status).toBe(0);
  });
});
