// T-E2E-8: PRD 7.1 Flow 8, change language, log out or delete the account.
import { expect, test } from '@playwright/test';
import { addReadings, admin, countReadings, logIn, loggedInUser, removeCreatedUsers } from './helpers';

test.afterAll(removeCreatedUsers);

test('T-E2E-8: Flow 8: language, Privacy Notice, log out, then delete the account', async ({ page }) => {
  const user = await loggedInUser(page, 'flow8');
  await addReadings(user.id, [[6.8, 'fasting']]);

  // 1. Profile icon -> S11.
  await page.getByRole('link', { name: 'My profile' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'My profile' })).toBeVisible();

  // 2. Language: only reviewed languages are listed (BR21: English for now).
  const language = page.getByRole('radiogroup', { name: 'Language' });
  await expect(language.getByRole('radio')).toHaveCount(1);
  await expect(language.getByRole('radio', { name: /English/ })).toBeChecked();

  // 2. "Privacy Notice" -> M2 -> "Close".
  await page.getByRole('button', { name: 'Privacy Notice' }).click();
  await expect(page.getByRole('dialog', { name: 'Privacy Notice' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/\/profile$/);

  // 3. "Log out" -> S1 as a Visitor.
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('banner').getByRole('link', { name: 'Log in' })).toBeVisible();

  // 4. Log in again; "Delete account" -> M3 -> "Cancel" -> S11.
  await logIn(page, user.email, user.password);
  await page.getByRole('link', { name: 'My profile' }).click();
  await page.getByRole('button', { name: 'Delete account' }).click();
  await expect(page.getByRole('dialog', { name: 'Delete your account?' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page).toHaveURL(/\/profile$/);

  // 4. "Yes, delete everything" -> S1 with the message; nothing remains.
  await page.getByRole('button', { name: 'Delete account' }).click();
  await page.getByRole('button', { name: 'Yes, delete everything' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Your account and data have been deleted.')).toBeVisible();
  expect(await countReadings(user.id)).toBe(0);
  const { data } = await admin.auth.admin.getUserById(user.id);
  expect(data.user).toBeNull();
});
