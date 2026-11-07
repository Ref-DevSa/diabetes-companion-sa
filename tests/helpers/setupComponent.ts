import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { i18n } from '../../src/i18n';

afterEach(async () => {
  cleanup();
  try {
    window.localStorage.clear();
  } catch {
    // storage can be unavailable; tests must not depend on it
  }
  await i18n.changeLanguage('en');
});
