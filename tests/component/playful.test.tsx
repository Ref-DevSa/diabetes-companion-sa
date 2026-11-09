// BR15: humour and playful wording only for saved Readings, ticks and learning;
// never for Flags, the Safety Guide, error messages or deleting anything.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { AppRoutes } from '../../src/App';
import * as content from '../../src/data/content';
import en from '../../src/i18n/en.json';
import { ok } from '../../src/lib/errors';
import { fakeSafetyItems } from '../helpers/contentFixtures';
import { renderWithProviders } from '../helpers/render';

vi.mock('../../src/data/content', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/data/content')>();
  return { ...original, listSafetyItems: vi.fn() };
});

function leaves(node: unknown, path = ''): Array<[string, string]> {
  if (typeof node === 'string') return [[path, node]];
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) => leaves(value, path ? `${path}.${key}` : key));
}

const all = leaves(en);
/** The playful texts in the app: the BR14 messages and the cheerful Checklist lines. */
const playful = [...Object.values(en.friendly), en.checklist.allDone, en.checklist.newDay];
/** Keys where playful wording must never appear (BR15). */
const serious = (key: string) =>
  key.startsWith('flag.') ||
  key.startsWith('safety.') ||
  key.startsWith('errors.') ||
  /error|Error/.test(key) ||
  /delete|Delete|deleted/.test(key);

afterEach(() => vi.restoreAllMocks());

describe('T-BR15-1: playful wording only for saved Readings, ticks and learning', () => {
  it('T-BR15-1: the playful texts are exactly the BR14 messages and the Checklist lines', () => {
    expect(playful).toHaveLength(7);
    expect(Object.values(en.friendly)).toEqual([
      'High five! Reading saved.',
      'Nice one! Reading saved.',
      'Saved! Your clinic will love this.',
      'Got it! Reading saved.',
      "Done! That's one more for your Diary.",
    ]);
  });

  it('T-BR15-1: no Flag, Safety Guide, error or delete text is playful (no exclamation marks, none of the playful lines)', () => {
    const offending = all.filter(([key, text]) => serious(key) && (playful.includes(text) || text.includes('!')));
    expect(offending).toEqual([]);
  });

  it('T-BR15-1: S6 shows no playful wording', async () => {
    vi.mocked(content.listSafetyItems).mockResolvedValue(ok(fakeSafetyItems));
    renderWithProviders(<AppRoutes />, { route: '/safety' });
    await screen.findByText('Shaking or feeling jittery');
    const text = screen.getByRole('main').textContent ?? '';
    for (const line of playful) expect(text).not.toContain(line);
    expect(text).not.toContain('!');
  });
});
