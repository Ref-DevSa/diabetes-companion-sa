// Shared steps for the end-to-end tests. Each test makes its own throw-away account
// (it-...@example.co.za) with the integration helpers, so the seeded test Users are never changed.
import { expect, type Page } from '@playwright/test';
import '../helpers/loadEnv';
import { admin, createUser } from '../helpers/supabaseTest';

export { admin, createUser, followLink, linkIn, removeCreatedUsers, testPassword, track, uniqueEmail, waitForEmail } from '../helpers/supabaseTest';

/** Where the e2e dev server runs (playwright.config.ts). */
export const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5174';

/** The BR14 friendly messages. */
export const friendly = /High five! Reading saved.|Nice one! Reading saved.|Saved! Your clinic will love this.|Got it! Reading saved.|Done! That's one more for your Diary./;

export const offlineBanner = "You're offline. Some things may not work until you reconnect.";

/** Logs in on S3 and waits until the app has left S3. */
export async function logIn(page: Page, email: string, password: string, start = '/log-in') {
  if (start) await page.goto(start);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).not.toHaveURL(/\/log-in$/);
}

/** A new confirmed account, already logged in on this page. */
export async function loggedInUser(page: Page, tag: string) {
  const user = await createUser(`e2e-${tag}`);
  await logIn(page, user.email, user.password);
  await expect(page.getByText('Welcome back!')).toBeVisible();
  return user;
}

/** Readings for a User, added as the admin would (one an hour apart, the newest an hour ago). */
export async function addReadings(userId: string, values: Array<[number, string]>) {
  const now = Date.now();
  const rows = values.map(([value, when], i) => ({
    user_id: userId,
    value,
    reading_when: when,
    taken_at: new Date(now - (i + 1) * 60 * 60 * 1000).toISOString(),
  }));
  const { error } = await admin.from('readings').insert(rows);
  if (error) throw new Error(error.message);
}

export async function countReadings(userId: string): Promise<number> {
  const { count } = await admin.from('readings').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  return count ?? 0;
}

/** The header's red "Warning signs" button (the S1 card has a similar name). */
export function warningSigns(page: Page) {
  return page.getByRole('banner').getByRole('link', { name: 'Warning signs', exact: true });
}
