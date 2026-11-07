import { describe, expect, it } from 'vitest';
import { getFlag } from '../../src/lib/flag';
import { READING_WHEN } from '../../src/lib/readingRules';

const notFasting = READING_WHEN.filter((when) => when !== 'fasting');

describe('BR5: the Flag at every edge', () => {
  it('T-BR5-1: 3.8 is Low', () => {
    expect(getFlag(3.8, 'other')).toBe('low');
  });

  it('T-BR5-2: exactly 3.9 has no Flag', () => {
    expect(getFlag(3.9, 'fasting')).toBeNull();
    expect(getFlag(3.9, 'bedtime')).toBeNull();
  });

  it('T-BR5-3: exactly 14.0 with Fasting has no Flag', () => {
    expect(getFlag(14.0, 'fasting')).toBeNull();
  });

  it('T-BR5-4: 14.1 with Fasting is Very high', () => {
    expect(getFlag(14.1, 'fasting')).toBe('very_high');
  });

  it('T-BR5-5: 14.1 After a meal (or any When but Fasting) has no Flag', () => {
    expect(getFlag(14.1, 'after_meal')).toBeNull();
    for (const when of notFasting) expect(getFlag(14.1, when), when).toBeNull();
  });

  it('T-BR5-6: exactly 16.5 has no Flag unless Fasting (where 14.0 already applies)', () => {
    for (const when of notFasting) expect(getFlag(16.5, when), when).toBeNull();
    expect(getFlag(16.5, 'fasting')).toBe('very_high');
  });

  it('T-BR5-7: 16.6 is Very high for any When', () => {
    for (const when of READING_WHEN) expect(getFlag(16.6, when), when).toBe('very_high');
  });

  it('T-BR5-8: Low wins at 3.8 for any When', () => {
    for (const when of READING_WHEN) expect(getFlag(3.8, when), when).toBe('low');
    expect(getFlag(1.0, 'fasting')).toBe('low');
    expect(getFlag(40.0, 'bedtime')).toBe('very_high');
  });
});
