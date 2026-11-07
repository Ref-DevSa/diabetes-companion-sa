import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// Section 4.1 of IMPLEMENTATION_PLAN.md, plus the type packages and the React plugin that the listed tools need.
const allowed = new Set([
  // Runtime (Section 4.1)
  'react',
  'react-dom',
  'react-router',
  '@supabase/supabase-js',
  'i18next',
  'react-i18next',
  'lucide-react',
  '@fontsource-variable/inter',
  // Build, styling and type check (Section 4.1)
  'typescript',
  'vite',
  '@vitejs/plugin-react',
  'tailwindcss',
  '@tailwindcss/vite',
  '@types/react',
  '@types/react-dom',
  '@types/node',
  // Tests (Section 4.1)
  'vitest',
  '@vitest/coverage-v8',
  '@testing-library/react',
  '@testing-library/user-event',
  '@testing-library/jest-dom',
  'jsdom',
  '@playwright/test',
  '@axe-core/playwright',
  'supabase',
  // Lint (Section 4.1)
  'eslint',
  '@eslint/js',
  'typescript-eslint',
  'eslint-plugin-react-hooks',
]);

type Pkg = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts: Record<string, string>;
};

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as Pkg;

describe('T-SETUP-1: project setup', () => {
  it('T-SETUP-1: runs on Node 22 or 24 LTS', () => {
    const major = Number(process.versions.node.split('.')[0]);
    expect([22, 24]).toContain(major);
  });

  it('T-SETUP-1: package.json lists only libraries named in Section 4.1', () => {
    const names = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
    expect(names.filter((name) => !allowed.has(name))).toEqual([]);
  });

  it('T-SETUP-1: package.json has every command in Section 4.3', () => {
    for (const script of [
      'db:start',
      'db:stop',
      'db:reset',
      'dev',
      'test:unit',
      'test:component',
      'test:db',
      'test:int',
      'test:e2e',
      'lint',
      'typecheck',
      'scan:secrets',
      'test:coverage',
      'check',
      'build',
    ]) {
      expect(pkg.scripts[script], script).toBeTruthy();
    }
    expect(pkg.scripts.check).toBe(
      'npm run lint && npm run typecheck && npm run scan:secrets && npm run test:unit && npm run test:component && npm run test:db && npm run test:int && npm run test:e2e',
    );
  });
});
