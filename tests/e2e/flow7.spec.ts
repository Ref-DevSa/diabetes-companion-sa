// T-E2E-7: PRD 7.1 Flow 7, see the Dashboard.
import { expect, test } from '@playwright/test';
import { addReadings, loggedInUser, removeCreatedUsers } from './helpers';

test.afterAll(removeCreatedUsers);

test('T-E2E-7: Flow 7: the last 7 Readings and today\'s progress; the links go to S8 and S9', async ({ page }) => {
  const user = await loggedInUser(page, 'flow7');
  await addReadings(user.id, [
    [6.8, 'fasting'],
    [3.6, 'bedtime'],
    [9.4, 'after_meal'],
    [14.6, 'fasting'],
    [7.2, 'before_meal'],
    [5.5, 'other'],
    [6.1, 'other'],
    [8.0, 'other'],
  ]);
  await page.goto('/checklist');
  await page.getByRole('checkbox', { name: 'Drink water' }).click();
  await expect(page.getByText('1 of 4 done')).toBeVisible();

  // 1-2. Dashboard tab -> S10.
  await page.getByRole('navigation').getByRole('link', { name: 'Dashboard' }).click();
  const readings = page.getByRole('region', { name: 'Last 7 readings' });
  await expect(readings.getByRole('listitem')).toHaveCount(7);
  await expect(readings.getByRole('listitem').nth(1).getByText('Low', { exact: true })).toBeVisible();
  await expect(readings.getByRole('listitem').nth(3).getByText('Very high', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: "Today's checklist" })).toContainText('1 of 4 done');

  // 3. "See all in my Diary" -> S8; "Go to Checklist" -> S9.
  await readings.getByRole('link', { name: 'See all in my Diary' }).click();
  await expect(page).toHaveURL(/\/diary$/);
  await page.goBack();
  await page.getByRole('link', { name: 'Go to Checklist' }).click();
  await expect(page).toHaveURL(/\/checklist$/);
});

test('T-E2E-7: Flow 7: no Readings -> the empty message and "Add a reading" -> S8', async ({ page }) => {
  await loggedInUser(page, 'flow7-empty');
  await page.goto('/dashboard');
  await expect(page.getByText('No readings yet. Add your first one in the Diary.')).toBeVisible();
  await expect(page.getByRole('region', { name: "Today's checklist" })).toContainText('0 of 4 done');
  await page.getByRole('main').getByRole('link', { name: 'Add a reading' }).click();
  await expect(page).toHaveURL(/\/diary$/);
});
