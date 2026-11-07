import { describe, expect, it } from 'vitest';
import en from '../../src/i18n/en.json';
import zu from '../../src/i18n/zu.json';
import { i18n } from '../../src/i18n';

describe('T-BR17-1: English fallback for missing translations', () => {
  it('T-BR17-1: a key missing in zu.json returns the English text', () => {
    expect((zu as Record<string, unknown>).home).toBeUndefined();
    const tZulu = i18n.getFixedT('zu');
    expect(tZulu('home.heroTitle')).toBe(en.home.heroTitle);
    expect(tZulu('home.heroTitle')).toBe('Understand diabetes. Track your day.');
  });

  it('T-BR17-1: a key missing in tn.json returns the English text', () => {
    expect(i18n.getFixedT('tn')('offline.banner')).toBe(
      "You're offline. Some things may not work until you reconnect.",
    );
  });

  it('T-BR17-1: English is the default language', () => {
    expect(i18n.options.fallbackLng).toEqual(['en']);
  });
});
