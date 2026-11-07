import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
      thresholds: { lines: 80 },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'component',
          // Typing with user-event is slow when all files run in parallel; 15 s per test, same checks.
          testTimeout: 15_000,
          include: ['tests/component/**/*.test.tsx'],
          environment: 'jsdom',
          setupFiles: ['tests/helpers/setupComponent.ts'],
          css: true,
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.{ts,tsx}'],
          environment: 'node',
          setupFiles: ['tests/helpers/loadEnv.ts'],
        },
      },
    ],
  },
});
