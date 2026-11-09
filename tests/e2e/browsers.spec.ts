// T-NFR-4: key flows on Pixel 5 (Chromium), desktop Chromium, Firefox and WebKit (playwright.config.ts projects).
// Samsung Internet is checked by hand (Phase 8 Step 5).
import { expect, test } from '@playwright/test';
import { friendly, loggedInUser, removeCreatedUsers, warningSigns } from './helpers';

test.afterAll(removeCreatedUsers);

test('T-NFR-4: a Visitor reads a Topic and opens the Safety Guide', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Learn', exact: true }).first().click();
  await expect(page).toHaveURL(/\/learn$/);
  await page.getByRole('button', { name: /What is diabetes\?/ }).click();
  await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
  await warningSigns(page).click();
  await expect(page.getByRole('region', { name: 'In an emergency, get help now' })).toBeVisible();
});

test('T-NFR-4: a User saves a Reading and ticks an Item', async ({ page }) => {
  await loggedInUser(page, 'browsers');
  await page.goto('/diary');
  await page.getByRole('button', { name: 'Add reading' }).click();
  await page.getByLabel('Reading (mmol/L)').fill('6.8');
  await page.getByLabel('When').selectOption({ label: 'Fasting' });
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(friendly)).toBeVisible();
  await expect(page.locator('article').first()).toContainText('6.8');

  await page.goto('/checklist');
  await page.getByRole('checkbox', { name: 'Drink water' }).click();
  await expect(page.getByText('1 of 4 done')).toBeVisible();
});
