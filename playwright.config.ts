import { defineConfig, devices } from '@playwright/test';
import './tests/helpers/loadEnv';

// End-to-end tests build the app and serve the built files on port 5174 (what Users get, and fast,
// so the 3-second loading limit is not hit by a dev server compiling files). They use the LOCAL
// Supabase in .env, so they never depend on the computer's Wi-Fi address or a dev server left running.
const port = 5174;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  timeout: 60_000,
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    // Every spec on the main target: Android-size Chromium (PRD 12.1).
    { name: 'pixel5', use: { ...devices['Pixel 5'] } },
    // T-NFR-4: the key flows also run on desktop Chromium, Firefox and WebKit (Safari's engine).
    { name: 'desktop-chromium', testMatch: /browsers\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testMatch: /browsers\.spec\.ts/, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testMatch: /browsers\.spec\.ts/, use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `npx vite build && npx vite preview --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? '',
      VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
    },
  },
});
