/**
 * The app languages (BR17) and which ones are switched on (BR21).
 *
 * A language other than English may be marked `reviewed: true` ONLY after its screen text
 * and health content have been translated and reviewed by a qualified translator, and a row
 * with "translation:<code>" and "reviewed" has been added to docs/CONTENT_REVIEW_LOG.md.
 * The unit test T-BR21-1 checks this.
 */
export type LanguageCode = 'en' | 'zu' | 'tn';

export type Language = {
  code: LanguageCode;
  /** The language's own name, shown in the menu. */
  name: string;
  /** Short code shown on the header button. */
  short: string;
  reviewed: boolean;
};

export const languages: readonly Language[] = [
  { code: 'en', name: 'English', short: 'EN', reviewed: true },
  { code: 'zu', name: 'isiZulu', short: 'ZU', reviewed: false },
  { code: 'tn', name: 'Setswana', short: 'TN', reviewed: false },
];

export const enabledLanguages: LanguageCode[] = languages.filter((l) => l.reviewed).map((l) => l.code);

export function isLanguageCode(value: unknown): value is LanguageCode {
  return languages.some((l) => l.code === value);
}

export function findLanguage(code: string): Language {
  return languages.find((l) => l.code === code) ?? (languages[0] as Language);
}
