import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { enabledLanguages, languages } from '../../src/i18n/languages';

describe('T-BR21-1: a language is offered only after its review is recorded', () => {
  it('T-BR21-1: English, isiZulu and Setswana are defined with their names', () => {
    expect(languages.map((l) => [l.code, l.name, l.short])).toEqual([
      ['en', 'English', 'EN'],
      ['zu', 'isiZulu', 'ZU'],
      ['tn', 'Setswana', 'TN'],
    ]);
  });

  it('T-BR21-1: only English is enabled at the start', () => {
    expect(enabledLanguages).toEqual(['en']);
  });

  it('T-BR21-1: enabledLanguages lists exactly the languages marked reviewed', () => {
    expect(enabledLanguages).toEqual(languages.filter((l) => l.reviewed).map((l) => l.code));
  });

  it('T-BR21-1: every reviewed translation has a row in docs/CONTENT_REVIEW_LOG.md', () => {
    const log = readFileSync('docs/CONTENT_REVIEW_LOG.md', 'utf8');
    for (const language of languages.filter((l) => l.reviewed && l.code !== 'en')) {
      const row = log
        .split(/\r?\n/)
        .find((line) => line.includes(`translation:${language.code}`) && /reviewed/i.test(line));
      expect(row, `review row for ${language.name}`).toBeTruthy();
    }
  });
});
