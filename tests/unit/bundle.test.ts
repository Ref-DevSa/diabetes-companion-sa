// Reads the built app in dist/ (`npm run check` builds it first; Section 18, question 37).
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import '../helpers/loadEnv';
import { filesUnder } from '../helpers/sourceFiles';

const KB = 1024;
const built = existsSync('dist/index.html');

describe('T-NFR-2 / T-NFR-11: the built app exists to be checked', () => {
  it('dist/index.html exists (run `npm run build` first; `npm run check` does)', () => {
    expect(built).toBe(true);
  });
});

describe.skipIf(!built)('T-NFR-2: data usage of the built app (PRD 12.1)', () => {
  it('T-NFR-2: the first page load (HTML, the files it links, and one font) is under 500 KB gzip', () => {
    const html = readFileSync('dist/index.html', 'utf8');
    const linked = [...html.matchAll(/(?:src|href)="\/([^"]+)"/g)].map((m) => m[1]!).filter((path) => existsSync(join('dist', path)));
    const fonts = linked
      .filter((path) => path.endsWith('.css'))
      .flatMap((path) => [...readFileSync(join('dist', path), 'utf8').matchAll(/url\(\/?([^)]+\.woff2)\)/g)].map((m) => m[1]!));
    // An English page fetches one Inter file (Latin); count the largest to be safe. woff2 is already compressed.
    const largestFont = fonts.map((path) => readFileSync(join('dist', path)).length).sort((a, b) => b - a)[0] ?? 0;
    const total = gzipSync(html).length + linked.reduce((sum, path) => sum + gzipSync(readFileSync(join('dist', path))).length, 0) + largestFont;
    expect(total).toBeLessThan(500 * KB);
  });

  it('T-NFR-2: every SVG is under 50 KB', () => {
    const svgs = [...filesUnder('dist', ['.svg']), ...(existsSync('public') ? filesUnder('public', ['.svg']) : [])];
    expect(svgs.filter((path) => readFileSync(path).length >= 50 * KB)).toEqual([]);
  });

  it('T-NFR-2: no video or photo files', () => {
    const media = ['.mp4', '.webm', '.mov', '.avi', '.jpg', '.jpeg', '.heic', '.gif', '.webp'];
    const found = [...filesUnder('dist', media), ...filesUnder('src', media), ...(existsSync('public') ? filesUnder('public', media) : [])];
    expect(found).toEqual([]);
  });
});

describe.skipIf(!built)('T-NFR-11: no secret key in the built app (PRD 12.3)', () => {
  const text = built ? filesUnder('dist', ['.js', '.html', '.css', '.map', '.json']).map((path) => readFileSync(path, 'utf8')).join('\n') : '';

  it('T-NFR-11: no service role key, secret key or their names', () => {
    expect(text).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    // The Supabase library names the "sb_secret_" prefix to warn about it; only a real key fails.
    expect(text).not.toMatch(/sb_secret_[A-Za-z0-9_-]{20,}/);
    // The Privacy Notice names Brevo (the email service); only the key's name or a key value fails.
    expect(text).not.toMatch(/BREVO_SMTP_KEY|xsmtpsib-[a-f0-9]{20,}|xkeysib-[a-f0-9]{20,}/);
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) expect(text).not.toContain(serviceKey);
  });

  it('T-NFR-11: no JWT that carries the service_role', () => {
    const payloads = [...text.matchAll(/eyJ[A-Za-z0-9_-]+\.(eyJ[A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)].map((m) => Buffer.from(m[1]!, 'base64url').toString());
    expect(payloads.filter((payload) => payload.includes('service_role'))).toEqual([]);
  });

  it('T-NFR-11: the test password is not in the built app', () => {
    const password = process.env.TEST_USER_PASSWORD;
    if (password) expect(text).not.toContain(password);
  });
});
