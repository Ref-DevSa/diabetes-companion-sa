// Release checks (Phase 9). T-REL-1 fails until the human has ticked every launch gate.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import '../helpers/loadEnv';
import { enabledLanguages, languages } from '../../src/i18n/languages';
import { filesUnder } from '../helpers/sourceFiles';

function tableRows(path: string): string[][] {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.startsWith('|') && !/^\|\s*-/.test(line))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));
}

describe('T-REL-1: every launch gate is closed (docs/LAUNCH_GATES.md)', () => {
  const gates = tableRows('docs/LAUNCH_GATES.md').filter((cells) => /^L\d+$/.test(cells[1] ?? ''));

  it('T-REL-1: the file lists the ten gates L1 to L10', () => {
    expect(gates.map((cells) => cells[1])).toEqual(['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10']);
  });

  it.each(['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10'])('T-REL-1: gate %s is ticked, with its date and evidence', (gate) => {
    const row = gates.find((cells) => cells[1] === gate);
    expect(row?.[0], `${gate} ticked`).toBe('[x]');
    expect((row?.[5] ?? '').length, `${gate} date and evidence`).toBeGreaterThan(0);
  });
});

describe('T-REL-4: the production build contains only the publishable key', () => {
  const built = existsSync('dist/index.html');

  it('T-REL-4: the production build exists (`npm run check` builds it)', () => {
    expect(built).toBe(true);
  });

  it.skipIf(!built)('T-REL-4: every Supabase key in the build is the publishable key from .env', () => {
    const text = filesUnder('dist', ['.js', '.html']).map((path) => readFileSync(path, 'utf8')).join('\n');
    const keys = new Set(text.match(/sb_(?:publishable|secret)_[A-Za-z0-9_-]{20,}/g) ?? []);
    expect([...keys]).toEqual([process.env.VITE_SUPABASE_PUBLISHABLE_KEY]);
  });
});

describe('T-REL-6: every switched-on language has a recorded review (docs/CONTENT_REVIEW_LOG.md)', () => {
  const reviews = tableRows('docs/CONTENT_REVIEW_LOG.md').filter((cells) => /reviewed|approved/i.test(cells[3] ?? ''));

  it('T-REL-6: English is switched on and its health content has a qualified review recorded (gate L1)', () => {
    expect(enabledLanguages).toContain('en');
    const english = reviews.filter((cells) => /\ben\b|English|content/i.test(cells[1] ?? '') && !/translation:/.test(cells[1] ?? ''));
    expect(english.length, 'a "reviewed" row for the English health content').toBeGreaterThan(0);
  });

  it.each(languages.filter((language) => language.code !== 'en').map((language) => [language.name, language.code] as const))(
    'T-REL-6: %s is switched on only with a "translation:%s" review',
    (_name, code) => {
      const reviewed = reviews.some((cells) => (cells[1] ?? '').includes(`translation:${code}`));
      expect(!enabledLanguages.includes(code) || reviewed).toBe(true);
    },
  );
});

describe('Phase 9 Step 3: the live app on Vercel', () => {
  it('deep links (for example /diary, or the email link back to /log-in) open the app instead of "404 Not Found"', () => {
    expect(existsSync('vercel.json')).toBe(true);
    const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as { rewrites?: Array<{ source: string; destination: string }> };
    expect(config.rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }]);
  });
});
