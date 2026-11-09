import { describe, expect, it } from 'vitest';
import en from '../../src/i18n/en.json';
import { errorMessageKey } from '../../src/lib/errors';
import {
  CUSTOM_ITEM_LIMIT,
  ITEM_NAME_MAX,
  STANDARD_KEYS,
  canAddCustomItem,
  checklistProgress,
  validateItemName,
} from '../../src/lib/checklistRules';

function t(key: string): string {
  return key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], en) as string;
}

describe('BR10: the four Standard Items', () => {
  it('T-BR10-1: four Standard Items in the PRD order, named by standard_key', () => {
    expect(STANDARD_KEYS).toEqual(['medication', 'glucose_check', 'water', 'activity']);
    expect(STANDARD_KEYS.map((key) => t(`checklist.standard.${key}`))).toEqual([
      'Take my medication as prescribed',
      'Check my glucose if my care plan says so',
      'Drink water',
      'Do suitable physical activity',
    ]);
  });
});

describe('BR11: Custom Items', () => {
  it('T-BR11-1: a name is 1 to 60 characters', () => {
    expect(ITEM_NAME_MAX).toBe(60);
    expect(validateItemName('Evening walk', [])).toBeNull();
    expect(validateItemName('a'.repeat(60), [])).toBeNull();
    expect(validateItemName('a'.repeat(61), [])).toBe('errors.itemNameTooLong');
    expect(validateItemName('', [])).toBe('errors.itemNameRequired');
    expect(validateItemName('   ', [])).toBe('errors.itemNameRequired');
    expect(t('errors.itemNameRequired')).toBe('Enter a name for your item.');
    expect(t('errors.itemNameTooLong')).toBe('Item names can be up to 60 characters.');
  });

  it('T-BR11-1: a name must be unique for the User, ignoring capitals and outer spaces', () => {
    expect(validateItemName('evening walk', ['Evening walk'])).toBe('errors.itemNameTaken');
    expect(validateItemName('  EVENING WALK ', ['Evening walk'])).toBe('errors.itemNameTaken');
    expect(validateItemName('Evening walk', ['Morning stretch'])).toBeNull();
    expect(t('errors.itemNameTaken')).toBe('You already have an item with this name.');
  });

  it('T-BR11-1: renaming an Item to its own name (or new capitals) is allowed', () => {
    expect(validateItemName('Evening Walk', ['Evening walk'], 'Evening walk')).toBeNull();
  });

  it('T-BR11-2: up to 6 Custom Items, with the PRD message at the limit', () => {
    expect(CUSTOM_ITEM_LIMIT).toBe(6);
    expect(canAddCustomItem(5)).toBe(true);
    expect(canAddCustomItem(6)).toBe(false);
    expect(t(errorMessageKey.custom_item_limit)).toBe('You can add up to 6 of your own items.');
  });
});

describe('BR13: progress', () => {
  it('T-BR13-1: "X of Y done" where Y counts every Item on today\'s Checklist', () => {
    expect(checklistProgress(['a', 'b', 'c', 'd'], [])).toEqual({ done: 0, total: 4, allDone: false });
    expect(checklistProgress(['a', 'b', 'c', 'd', 'e'], ['a', 'c'])).toEqual({ done: 2, total: 5, allDone: false });
    expect(t('checklist.progress').replace('{{done}}', '2').replace('{{total}}', '5')).toBe('2 of 5 done');
  });

  it('T-BR13-1: ticks for Items no longer on the Checklist do not count', () => {
    expect(checklistProgress(['a', 'b'], ['a', 'gone'])).toEqual({ done: 1, total: 2, allDone: false });
  });

  it('T-BR13-2: when every Item is ticked: "All done today. Nice work!"', () => {
    expect(checklistProgress(['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'd'])).toEqual({ done: 4, total: 4, allDone: true });
    expect(t('checklist.allDone')).toBe('All done today. Nice work!');
  });
});
