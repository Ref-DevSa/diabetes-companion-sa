import { afterAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

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
  }, 30_000); // the whole repository and its Git history are read
});

// Each test makes a small Git repository, so it needs more than the 5-second default when all tests run at once.
describe('Phase 8 Step 2: the secret scan also checks Git history', { timeout: 30_000 }, () => {
  const script = resolve('scripts/scan-secrets.mjs');
  const git = (cwd: string, ...args: string[]) => spawnSync('git', args, { cwd, encoding: 'utf8' });

  function repoWithHistory(secretLine: string) {
    const repo = join(tempDir, `repo-${Math.random().toString(36).slice(2, 8)}`);
    mkdirSync(repo);
    git(repo, 'init', '-q');
    git(repo, 'config', 'user.email', 'scan-test@example.co.za');
    git(repo, 'config', 'user.name', 'Scan test');
    git(repo, 'config', 'commit.gpgsign', 'false');
    writeFileSync(join(repo, 'old.ts'), secretLine);
    git(repo, 'add', '.');
    git(repo, 'commit', '-q', '-m', 'first');
    writeFileSync(join(repo, 'old.ts'), 'export const clean = true;\n');
    git(repo, 'commit', '-q', '-am', 'removed');
    return repo;
  }

  it('T-SETUP-9: a secret removed in a later commit is still found in history', () => {
    const repo = repoWithHistory(`const key = '${'sb_' + 'secret_' + 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4'}';\n`);
    const result = spawnSync(process.execPath, [script], { cwd: repo, encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toMatch(/history/i);
  });

  it('T-SETUP-9: clean history passes', () => {
    const repo = repoWithHistory('export const first = 1;\n');
    const result = spawnSync(process.execPath, [script], { cwd: repo, encoding: 'utf8' });
    expect(result.status).toBe(0);
  });
});
