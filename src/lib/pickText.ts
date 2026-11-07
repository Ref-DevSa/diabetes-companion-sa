import type { LanguageCode } from '../i18n/languages';

/**
 * Content text in the chosen language, or the English text when that translation is missing
 * (BR17, edge case 10). Rows have columns such as title_en, title_zu, title_tn.
 */
export function pickText(row: Record<string, unknown>, field: string, language: LanguageCode): string {
  const translated = row[`${field}_${language}`];
  if (typeof translated === 'string' && translated.trim() !== '') return translated;
  const english = row[`${field}_en`];
  return typeof english === 'string' ? english : '';
}
