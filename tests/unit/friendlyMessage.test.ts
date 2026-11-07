import { describe, expect, it } from 'vitest';
import en from '../../src/i18n/en.json';
import { FRIENDLY_MESSAGE_KEYS, pickFriendlyMessage } from '../../src/lib/friendlyMessage';

describe('BR14: friendly messages after a save without a Flag', () => {
  it('T-BR14-1: exactly the five PRD messages', () => {
    const texts = FRIENDLY_MESSAGE_KEYS.map((key) => (en.friendly as Record<string, string>)[key.replace('friendly.', '')]);
    expect(texts).toEqual([
      'High five! Reading saved.',
      'Nice one! Reading saved.',
      'Saved! Your clinic will love this.',
      'Got it! Reading saved.',
      "Done! That's one more for your Diary.",
    ]);
  });

  it('T-BR14-2: never the same message twice in a row over 100 picks, and all five are used', () => {
    let previous: string | null = null;
    const seen = new Set<string>();
    for (let i = 0; i < 100; i += 1) {
      const next = pickFriendlyMessage(previous);
      expect(next).not.toBe(previous);
      expect(FRIENDLY_MESSAGE_KEYS).toContain(next);
      seen.add(next);
      previous = next;
    }
    expect(seen.size).toBe(5);
  });

  it('T-BR14-2: even a random source that always gives the same number cannot repeat a message', () => {
    const stuck = () => 0;
    const first = pickFriendlyMessage(null, stuck);
    expect(pickFriendlyMessage(first, stuck)).not.toBe(first);
  });
});
