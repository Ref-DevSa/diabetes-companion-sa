// T-NFR-5 as decided in Section 18, question 36: isiZulu and Setswana stay empty until a qualified
// person has translated and reviewed them (BR21). Any key they do have must exist in English and
// have text; every missing key shows the English text (BR17).
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import en from '../../src/i18n/en.json';
import tn from '../../src/i18n/tn.json';
import zu from '../../src/i18n/zu.json';
import { i18n } from '../../src/i18n';
import { Home } from '../../src/screens/Home';
import { MemoryRouter } from 'react-router';

function keys(node: unknown, path = ''): string[] {
  if (typeof node === 'string') return [path];
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) => keys(value, path ? `${path}.${key}` : key));
}

function valueAt(node: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((current, part) => (current as Record<string, unknown> | undefined)?.[part], node);
}

const english = new Set(keys(en));

describe.each([
  ['isiZulu', 'zu', zu],
  ['Setswana', 'tn', tn],
])('T-NFR-5: %s text file', (_name, code, file) => {
  it(`T-NFR-5: every ${code} key also exists in English (no stray or old keys)`, () => {
    expect(keys(file).filter((key) => !english.has(key))).toEqual([]);
  });

  it(`T-NFR-5: no ${code} value is empty`, () => {
    expect(keys(file).filter((key) => String(valueAt(file, key)).trim() === '')).toEqual([]);
  });

  it(`T-NFR-5: every key missing in ${code} shows the English text`, () => {
    const t = i18n.getFixedT(code);
    const missing = [...english].filter((key) => valueAt(file, key) === undefined);
    for (const key of missing) expect(t(key), key).toBe(valueAt(en, key));
  });

  it(`T-NFR-5: S1 renders in ${code} with the English text where there is no translation`, async () => {
    const local = i18n.cloneInstance({ lng: code });
    render(
      <I18nextProvider i18n={local}>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </I18nextProvider>,
    );
    expect(await screen.findByRole('heading', { name: valueAt(file, 'home.heroTitle') ? String(valueAt(file, 'home.heroTitle')) : en.home.heroTitle })).toBeInTheDocument();
  });
});
