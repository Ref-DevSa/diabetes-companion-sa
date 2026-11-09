// T-E2E-2: PRD 7.1 Flow 2, save a Reading, with the unhappy branches.
import { expect, test } from '@playwright/test';
import { countReadings, friendly, loggedInUser, removeCreatedUsers } from './helpers';

test.afterAll(removeCreatedUsers);

test('T-E2E-2: Flow 2: add, flag, edit and delete Readings', async ({ page }) => {
  const user = await loggedInUser(page, 'flow2');

  // 1. S1 "Add a reading" -> S8.
  await page.getByRole('link', { name: 'Add a reading' }).click();
  await expect(page).toHaveURL(/\/diary$/);

  // 2-3. M1; a rule fails -> the error under the field, stays in M1.
  await page.getByRole('button', { name: 'Add reading' }).first().click();
  await page.getByLabel('Reading (mmol/L)').fill('45');
  await page.getByLabel('When').selectOption({ label: 'Fasting' });
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Enter a number from 1.0 to 40.0.')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();

  // 4. No Flag -> a friendly message; the Reading is at the top.
  await page.getByLabel('Reading (mmol/L)').fill('6.8');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText(friendly)).toBeVisible();
  await expect(page.locator('article').first()).toContainText('6.8');

  // 4. A Flag -> the badge and the BR6 message, no friendly message.
  await page.getByRole('button', { name: 'Add reading' }).click();
  await page.getByLabel('Reading (mmol/L)').fill('3.6');
  await page.getByLabel('When').selectOption({ label: 'Bedtime' });
  await page.getByRole('button', { name: 'Save' }).click();
  const low = page.locator('article').filter({ hasText: '3.6' });
  await expect(low.getByText('Low', { exact: true })).toBeVisible();
  await expect(low.getByText('Your reading is low. Follow your care plan and talk to your clinic.')).toBeVisible();

  // 5. Edit 3.6 -> 5.2: the badge goes.
  await low.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Reading (mmol/L)').fill('5.2');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Reading updated.')).toBeVisible();
  const edited = page.locator('article').filter({ hasText: '5.2' });
  await expect(edited.getByText('Low', { exact: true })).toHaveCount(0);

  // 5. Delete -> M4 -> "Delete reading" -> gone.
  await edited.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Delete reading' }).click();
  await expect(page.getByText('Reading deleted.')).toBeVisible();
  await expect(page.locator('article')).toHaveCount(1);
  expect(await countReadings(user.id)).toBe(1);
});
