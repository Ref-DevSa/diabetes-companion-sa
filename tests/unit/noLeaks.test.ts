import { describe, expect, it } from 'vitest';
import en from '../../src/i18n/en.json';
import { appSources } from '../helpers/sourceFiles';

function leaves(node: unknown, path = ''): Array<[string, string]> {
  if (typeof node === 'string') return [[path, node]];
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) => leaves(value, path ? `${path}.${key}` : key));
}

describe('T-NFR-10: no glucose value, email or password leaks (PRD 12.3)', () => {
  it('T-NFR-10: the app never writes to the console', () => {
    expect(appSources().filter(({ text }) => /console\.(log|info|warn|error|debug)/.test(text)).map(({ path }) => path)).toEqual([]);
  });

  it('T-NFR-10: no web address is built with an email, password, value or note', () => {
    const pattern = /[?&](email|password|value|note|reading)=|searchParams\.(set|append)\(\s*['"](email|password|value|note)/i;
    expect(appSources().filter(({ text }) => pattern.test(text)).map(({ path }) => path)).toEqual([]);
  });

  it('T-NFR-10: no error message has a place for an email, password or glucose value', () => {
    const errorTexts = leaves(en).filter(([key]) => /error/i.test(key));
    expect(errorTexts.filter(([, text]) => /\{\{\s*(email|password|value|note)\s*\}\}/.test(text))).toEqual([]);
  });

  it('T-NFR-10: database error text is never shown to the person (only the PRD messages)', () => {
    const pattern = /\{\s*(error|result\.error)\.message\s*\}|\bt\(\s*error\.message|\bset\w*\(\s*error\.message/;
    expect(appSources().filter(({ text }) => pattern.test(text)).map(({ path }) => path)).toEqual([]);
  });
});
