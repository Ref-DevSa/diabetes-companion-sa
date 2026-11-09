import { expect, test } from '@playwright/test';
import { countReadings, friendly, loggedInUser, offlineBanner, removeCreatedUsers, warningSigns } from './helpers';

test.afterAll(removeCreatedUsers);

const visitorScreens: Array<[string, string]> = [
  ['S1', '/'],
  ['S2', '/sign-up'],
  ['S3', '/log-in'],
  ['S4', '/forgot-password'],
  ['S5', '/learn'],
  ['S6', '/safety'],
  ['S7', '/help'],
];
const userScreens: Array<[string, string]> = [
  ['S8', '/diary'],
  ['S9', '/checklist'],
  ['S10', '/dashboard'],
  ['S11', '/profile'],
];

test.describe('T-NFR-3: the offline banner on every screen', () => {
  for (const [id, path] of visitorScreens) {
    test(`T-NFR-3: ${id} ${path} shows the offline banner`, async ({ page, context }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await context.setOffline(true);
      await expect(page.getByText(offlineBanner)).toBeVisible();
      await context.setOffline(false);
      await expect(page.getByText(offlineBanner)).toBeHidden();
    });
  }

  test('T-NFR-3: S8 to S11 show the offline banner', async ({ page, context }) => {
    await loggedInUser(page, 'offline-screens');
    for (const [, path] of userScreens) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await context.setOffline(true);
      await expect(page.getByText(offlineBanner), path).toBeVisible();
      await context.setOffline(false);
    }
  });

  test('T-NFR-3: offline, "Warning signs" still opens S6 with the emergency box', async ({ page, context }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await context.setOffline(true);
    await warningSigns(page).click();
    await expect(page).toHaveURL(/\/safety$/);
    await expect(page.getByRole('region', { name: 'In an emergency, get help now' })).toContainText('112');
    await expect(page.getByText(offlineBanner)).toBeVisible();
  });
});

test('T-BR23-3: with the network cut, Save is disabled and nothing is reported saved; after reconnecting, saving and "Try again" work', async ({ page, context }) => {
  const user = await loggedInUser(page, 'offline-save');
  await page.goto('/diary');
  await page.getByRole('button', { name: 'Add reading' }).click();
  await page.getByLabel('Reading (mmol/L)').fill('6.8');
  await page.getByLabel('When').selectOption({ label: 'Fasting' });

  await context.setOffline(true);
  await expect(page.getByText(offlineBanner)).toBeVisible();
  await expect(page.getByRole('dialog').getByText("You're offline. Reconnect and try again.")).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
  await expect(page.getByLabel('Reading (mmol/L)')).toHaveValue('6.8');
  await expect(page.getByText(friendly)).toHaveCount(0);
  expect(await countReadings(user.id)).toBe(0);

  await context.setOffline(false);
  await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(friendly)).toBeVisible();
  expect(await countReadings(user.id)).toBe(1);

  // A screen that failed to load while offline loads again after reconnecting.
  await context.setOffline(true);
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByText("We couldn't load your Dashboard. Please try again.")).toBeVisible();
  await context.setOffline(false);
  await page
    .getByRole('button', { name: 'Try again' })
    .click({ timeout: 2000 })
    .catch(() => undefined); // it may already have reloaded by itself on reconnecting
  await expect(page.getByRole('region', { name: 'Last 7 readings' })).toContainText('6.8');
});
