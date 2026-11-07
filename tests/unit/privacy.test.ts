import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'vite';

// Tracking, advertising and analytics services the app must never contain (BR24).
const trackers = [
  'google-analytics.com',
  'googletagmanager.com',
  'gtag(',
  'doubleclick.net',
  'connect.facebook.net',
  'fbq(',
  'hotjar',
  'segment.io',
  'segment.com',
  'mixpanel',
  'amplitude.com',
  'sentry.io',
  'clarity.ms',
  'plausible.io',
  'posthog',
  'adsbygoogle',
];

const outDir = mkdtempSync(join(tmpdir(), 'dcsa-privacy-'));
let bundle = '';
let html = '';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : [path];
  });
}

beforeAll(async () => {
  await build({ logLevel: 'silent', build: { outDir, emptyOutDir: true } });
  const assets = join(outDir, 'assets');
  bundle = readdirSync(assets)
    .filter((name) => name.endsWith('.js'))
    .map((name) => readFileSync(join(assets, name), 'utf8'))
    .join('\n');
  html = readFileSync(join(outDir, 'index.html'), 'utf8');
}, 120_000);

afterAll(() => rmSync(outDir, { recursive: true, force: true }));

describe('T-BR24-1: no selling, no adverts, no tracking', () => {
  it('T-BR24-1: the built app contains no analytics, advertising or tracking code', () => {
    const found = trackers.filter((name) => bundle.toLowerCase().includes(name.toLowerCase()));
    expect(found).toEqual([]);
  });

  it('T-BR24-1: no third-party library for analytics or adverts is installed', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { dependencies: Record<string, string> };
    const found = Object.keys(pkg.dependencies).filter((name) => trackers.some((t) => name.includes(t.replace(/\W/g, ''))));
    expect(found).toEqual([]);
  });

  it('T-BR24-1: index.html loads nothing from another host', () => {
    expect(html).not.toMatch(/<(script|link)[^>]+(src|href)=["']https?:\/\//i);
  });

  it('T-BR24-1: the app source requests no hard-coded web address (only Supabase from .env)', () => {
    const offenders = sourceFiles('src')
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => /fetch\(\s*['"`]https?:/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
