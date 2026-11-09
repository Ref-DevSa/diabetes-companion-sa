// T-E2E-4: PRD 7.1 Flow 4, read a Topic.
import { expect, test } from '@playwright/test';

test('T-E2E-4: Flow 4: open a Topic, check the language menu, close it, go to S7', async ({ page }) => {
  // 1. S1 "Learn about diabetes" -> S5.
  await page.goto('/');
  await page.getByRole('link', { name: /Learn about diabetes/ }).click();
  await expect(page).toHaveURL(/\/learn$/);

  // 2. Tap a Topic -> it opens in place.
  await page.getByRole('button', { name: /What is diabetes\?/ }).click();
  await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
  await expect(page).toHaveURL(/\/learn$/);

  // 3. The language selector lists only reviewed languages (BR21: English only for now); choosing it keeps English.
  await page.getByRole('button', { name: /Language/ }).click();
  const options = page.getByRole('menuitemradio');
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveText(/English/);
  await options.first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Learn' })).toBeVisible();

  // 4. "Close", then "Help for family and caregivers" -> S7.
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('button', { name: 'Close' })).toHaveCount(0);
  await page.getByRole('link', { name: /Help for family and caregivers/ }).click();
  await expect(page).toHaveURL(/\/help$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Help and family support' })).toBeVisible();
});
