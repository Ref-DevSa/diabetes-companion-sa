// T-E2E-3: PRD 7.1 Flow 3, tick the Checklist, with the 6-item limit.
import { expect, test } from '@playwright/test';
import { admin, loggedInUser, removeCreatedUsers } from './helpers';

test.afterAll(removeCreatedUsers);

test('T-E2E-3: Flow 3: tick every Item, add one of my own, then reach the limit', async ({ page }) => {
  const user = await loggedInUser(page, 'flow3');

  // 1. Checklist tab -> S9.
  await page.getByRole('navigation').getByRole('link', { name: 'Checklist' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();

  // 2. Tick -> ring and "X of Y done".
  await page.getByRole('checkbox', { name: 'Drink water' }).click();
  await expect(page.getByText('1 of 4 done')).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');

  // 3. All ticked -> "All done today. Nice work!"
  for (const name of ['Take my medication as prescribed', 'Check my glucose if my care plan says so', 'Do suitable physical activity']) {
    await page.getByRole('checkbox', { name }).click();
  }
  await expect(page.getByText('All done today. Nice work!')).toBeVisible();

  // 4. "Add my own item" -> M5 -> Save -> the new Item.
  await page.getByRole('button', { name: 'Add my own item' }).click();
  await page.getByLabel('Item name').fill('Evening walk');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('checkbox', { name: 'Evening walk' })).toBeVisible();
  await expect(page.getByText('4 of 5 done')).toBeVisible();

  // 4. Unhappy: 6 Custom Items already -> the limit message, M5 does not open.
  const { error } = await admin
    .from('checklist_items')
    .insert(['Two', 'Three', 'Four', 'Five', 'Six'].map((name) => ({ user_id: user.id, name, sort_order: 5 })));
  if (error) throw new Error(error.message);
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Six' })).toBeVisible();
  await page.getByRole('button', { name: 'Add my own item' }).click();
  await expect(page.getByText('You can add up to 6 of your own items.')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
