import { defineConfig, devices } from '@playwright/test';
import './tests/helpers/loadEnv';

// Phase 9 live checks (T-REL-2, T-REL-3) against the deployed app: `npm run test:live`.
// No local server is started; LIVE_BASE_URL in .env must be the live https address.
const baseURL = process.env.LIVE_BASE_URL ?? '';
if (!/^https:\/\//.test(baseURL)) {
  throw new Error('Set LIVE_BASE_URL in .env to the live https address before running npm run test:live.');
}

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: /live.spec.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [{ name: 'pixel5-live', use: { ...devices['Pixel 5'] } }],
});
