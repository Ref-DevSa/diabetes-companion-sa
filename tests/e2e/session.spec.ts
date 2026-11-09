import { devices, expect, test } from '@playwright/test';
import { addReadings, admin, baseURL, countReadings, logIn, loggedInUser, removeCreatedUsers } from './helpers';

test.afterAll(removeCreatedUsers);

const ended = 'Your session has ended. Please log in again.';

test('T-EDGE-3: a session last signed in more than 30 days ago is ended: S3 with the PRD message', async ({ page }) => {
  await loggedInUser(page, 'old-session');
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k));
    if (!key) throw new Error('no saved session');
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}');
    saved.user.last_sign_in_at = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.goto('/diary');
  await expect(page).toHaveURL(/\/log-in$/);
  await expect(page.getByText(ended)).toBeVisible();
});

test.describe('T-EDGE-9: the account is deleted on one phone while logged in on another', () => {
  async function secondPhone(browser: import('@playwright/test').Browser) {
    const context = await browser.newContext({ ...devices['Pixel 5'], baseURL });
    return { context, page: await context.newPage() };
  }

  async function deleteOnFirstPhone(page: import('@playwright/test').Page) {
    await page.getByRole('link', { name: 'My profile' }).click();
    await page.getByRole('button', { name: 'Delete account' }).click();
    await page.getByRole('button', { name: 'Yes, delete everything' }).click();
    await expect(page.getByText('Your account and data have been deleted.')).toBeVisible();
  }

  test('T-EDGE-9: when the other phone opens the app again, it is signed out with the PRD message; no data remains', async ({ page, browser }) => {
    const user = await loggedInUser(page, 'two-phones');
    await addReadings(user.id, [[6.8, 'fasting']]);
    const other = await secondPhone(browser);
    await logIn(other.page, user.email, user.password);
    await other.page.goto('/diary');
    await expect(other.page.getByText('6.8')).toBeVisible();

    await deleteOnFirstPhone(page);

    await other.page.reload();
    await expect(other.page).toHaveURL(/\/log-in$/);
    await expect(other.page.getByText(ended)).toBeVisible();
    expect(await countReadings(user.id)).toBe(0);
    const { data } = await admin.auth.admin.getUserById(user.id);
    expect(data.user).toBeNull();
    await other.context.close();
  });

  test('T-EDGE-9: when the other phone is still open and tries to save, it is signed out with the PRD message', async ({ page, browser }) => {
    const user = await loggedInUser(page, 'two-phones-save');
    const other = await secondPhone(browser);
    await logIn(other.page, user.email, user.password);
    await other.page.goto('/diary');
    await other.page.getByRole('button', { name: 'Add reading' }).click();
    await other.page.getByLabel('Reading (mmol/L)').fill('6.8');
    await other.page.getByLabel('When').selectOption({ label: 'Fasting' });

    await deleteOnFirstPhone(page);

    await other.page.getByRole('button', { name: 'Save' }).click();
    await expect(other.page).toHaveURL(/\/log-in$/);
    await expect(other.page.getByText(ended)).toBeVisible();
    expect(await countReadings(user.id)).toBe(0);
    await other.context.close();
  });
});
