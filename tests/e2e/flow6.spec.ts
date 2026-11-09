// T-E2E-6: PRD 7.1 Flow 6, reset a forgotten password, with the unhappy branches.
import { expect, test } from '@playwright/test';
import { createUser, linkIn, logIn, removeCreatedUsers, waitForEmail } from './helpers';

test.afterAll(removeCreatedUsers);

test('T-E2E-6: Flow 6: ask for a link, choose a new password, log in with it; a used link has expired', async ({ page }) => {
  const user = await createUser('e2e-flow6');
  const newPassword = `Fresh${Date.now()}x9`;

  // 1. S3 "Forgot password?" -> S4.
  await page.goto('/log-in');
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);

  // 2. Send the link.
  await page.getByLabel('Email').fill(user.email);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText("If this email is registered, we've sent a reset link.")).toBeVisible();

  // 3. The email's button -> S4 new password step.
  const link = linkIn(await waitForEmail(user.email));
  await page.goto(link);
  await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();

  // 4. Unhappy: the two differ.
  await page.getByLabel('New password', { exact: true }).fill(newPassword);
  await page.getByLabel('Confirm new password', { exact: true }).fill(`${newPassword}z`);
  await page.getByRole('button', { name: 'Save new password' }).click();
  await expect(page.getByText("Passwords don't match.")).toBeVisible();

  // 4. Same -> "Password changed. Please log in." on S3.
  await page.getByLabel('Confirm new password', { exact: true }).fill(newPassword);
  await page.getByRole('button', { name: 'Save new password' }).click();
  await expect(page).toHaveURL(/\/log-in$/);
  await expect(page.getByText('Password changed. Please log in.')).toBeVisible();
  await logIn(page, user.email, newPassword, '');
  await expect(page.getByText('Welcome back!')).toBeVisible();

  // 3. Unhappy: the same link again has expired.
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.goto(link);
  await expect(page.getByText('This link has expired. Ask for a new one.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send a new link' }).or(page.getByRole('link', { name: 'Send a new link' }))).toBeVisible();
});
