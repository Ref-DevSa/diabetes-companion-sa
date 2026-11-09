// Live checks against the deployed app (Phase 9: T-REL-2 and T-REL-3), run by playwright.live.config.ts.
// Run only with `npm run test:live`, after setting in .env:
//   LIVE_BASE_URL     the live Vercel address, for example https://diabetes-companion-sa.vercel.app
//   LIVE_TEST_EMAIL   a real inbox you can open now (T-REL-3); a new address each run
// These tests never use the service key and never touch the local Supabase.
import { expect, test } from '@playwright/test';
import { randomBytes } from 'node:crypto';

const liveEmail = process.env.LIVE_TEST_EMAIL ?? '';

test.describe('T-REL-2: a Visitor on the live app', () => {
  for (const [id, path, check] of [
    ['S1', '/', 'Understand diabetes. Track your day.'],
    ['S5', '/learn', 'What is diabetes?'],
    ['S6', '/safety', 'Shaking or feeling jittery'],
    ['S7', '/help', 'Diabetes South Africa'],
  ] as const) {
    test(`T-REL-2: ${id} opens and its content loads`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByText(check).first()).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(/DRAFT: NOT REVIEWED|TEST DATA/)).toHaveCount(0);
    });
  }

  test('T-REL-2: the live app is served over HTTPS', async ({ page }) => {
    await page.goto('/');
    expect(new URL(page.url()).protocol).toBe('https:');
  });
});

test.describe('T-REL-3: a real account on the live app, with the real email', () => {
  test.skip(liveEmail === '', 'Set LIVE_TEST_EMAIL in .env to a real inbox you can open now.');
  test.setTimeout(15 * 60 * 1000);

  test('T-REL-3: sign up, confirm the email, log in, save a Reading, log out, then delete the account', async ({ page }) => {
    // A fresh password for this run only; it is never written anywhere.
    const password = `Live${randomBytes(9).toString('base64url')}7`;

    await page.goto('/sign-up');
    await page.getByLabel('Email').fill(liveEmail);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('I confirm I am 18 or older').check();
    await page.getByRole('checkbox', { name: /I agree to the/ }).check();
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Check your email to confirm your account.')).toBeVisible();

    // The human opens the real email (sent through Brevo) and taps "Confirm your email".
    console.warn(`\n>>> Open the inbox of ${liveEmail}, check the email is NOT in spam, and tap "Confirm your email". Waiting up to 10 minutes...\n`);
    await expect
      .poll(
        async () => {
          await page.goto('/log-in');
          await page.getByLabel('Email').fill(liveEmail);
          await page.getByLabel('Password', { exact: true }).fill(password);
          await page.getByRole('button', { name: 'Log in' }).click();
          await page.waitForTimeout(3000);
          return new URL(page.url()).pathname;
        },
        { timeout: 10 * 60 * 1000, intervals: [15_000] },
      )
      .toBe('/');
    await expect(page.getByText('Welcome back!')).toBeVisible();

    await page.goto('/diary');
    await page.getByRole('button', { name: 'Add reading' }).first().click();
    await page.getByLabel('Reading (mmol/L)').fill('6.8');
    await page.getByLabel('When').selectOption({ label: 'Fasting' });
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('article').first()).toContainText('6.8');

    await page.getByRole('link', { name: 'My profile' }).click();
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Log in' })).toBeVisible();

    await page.goto('/log-in');
    await page.getByLabel('Email').fill(liveEmail);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.getByRole('link', { name: 'My profile' }).click();
    await page.getByRole('button', { name: 'Delete account' }).click();
    await page.getByRole('button', { name: 'Yes, delete everything' }).click();
    await expect(page.getByText('Your account and data have been deleted.')).toBeVisible();
  });
});
