import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('T-SETUP-8: the page loads with the title "Diabetes Companion SA"', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Diabetes Companion SA');
  await expect(page.getByRole('heading', { name: 'Understand diabetes. Track your day.' })).toBeVisible();
});

test('T-SETUP-8: axe finds no serious or critical accessibility violation on S1', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Understand diabetes. Track your day.' })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
