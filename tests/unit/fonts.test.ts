import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'vite';

const outDir = mkdtempSync(join(tmpdir(), 'dcsa-build-'));
let css = '';
let html = '';

beforeAll(async () => {
  await build({ logLevel: 'silent', build: { outDir, emptyOutDir: true } });
  const assets = join(outDir, 'assets');
  css = readdirSync(assets)
    .filter((name) => name.endsWith('.css'))
    .map((name) => readFileSync(join(assets, name), 'utf8'))
    .join('\n');
  html = readFileSync(join(outDir, 'index.html'), 'utf8');
}, 120_000);

afterAll(() => rmSync(outDir, { recursive: true, force: true }));

describe('T-SETUP-10: self-hosted Inter font', () => {
  it('T-SETUP-10: the built CSS declares Inter with font files from the app itself', () => {
    const faces = css.match(/@font-face\s*{[^}]*}/g) ?? [];
    const interFaces = faces.filter((face) => /Inter/.test(face));
    expect(interFaces.length).toBeGreaterThan(0);
    for (const face of interFaces) {
      const urls = [...face.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1] ?? '');
      expect(urls.length).toBeGreaterThan(0);
      for (const url of urls) {
        expect(url).not.toMatch(/^["']?(https?:)?\/\//);
      }
    }
  });

  it('T-SETUP-10: no request to Google Fonts or any font CDN', () => {
    expect(css + html).not.toMatch(/fonts\.googleapis|fonts\.gstatic|cdn\.tailwindcss/);
  });
});
