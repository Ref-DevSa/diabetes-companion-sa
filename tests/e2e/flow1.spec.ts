// T-E2E-1: PRD 7.1 Flow 1, sign up and log in, with the unhappy branches.
import { expect, test } from '@playwright/test';
import { createUser, followLink, linkIn, logIn, removeCreatedUsers, testPassword, track, uniqueEmail, waitForEmail } from './helpers';

test.afterAll(removeCreatedUsers);

test('T-E2E-1: Flow 1: sign up, confirm the email, log in', async ({ page }) => {
  const email = uniqueEmail('e2e-flow1');
  track(email);

  // 1. S1 -> S2.
  await page.goto('/');
  await page.getByRole('link', { name: 'Create free account' }).click();
  await expect(page).toHaveURL(/\/sign-up$/);

  // 2. Unhappy: boxes unticked -> errors under them; stays on S2.
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(testPassword);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Please confirm you are 18 or older.')).toBeVisible();
  await expect(page.getByText('Please agree to the Privacy Notice to continue.')).toBeVisible();
  await expect(page).toHaveURL(/\/sign-up$/);

  // The "Privacy Notice" link opens M2.
  await page.getByRole('button', { name: 'Privacy Notice' }).click();
  await expect(page.getByRole('dialog', { name: 'Privacy Notice' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  await page.getByLabel('I confirm I am 18 or older').check();
  await page.getByRole('checkbox', { name: /I agree to the/ }).check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Check your email to confirm your account.')).toBeVisible();

  // 3. Unhappy: log in before confirming.
  await page.goto('/log-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(testPassword);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText('Please confirm your email first. Check your inbox.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send the email again' })).toBeVisible();

  // 3. The confirmation email's button.
  const mail = await waitForEmail(email);
  await followLink(linkIn(mail));

  // 4. Unhappy: wrong password; then the right one -> S1 "Welcome back!" with the tab bar.
  await page.goto('/log-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(`${testPassword}-wrong`);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText('Email or password is incorrect.')).toBeVisible();
  await expect(page.getByLabel('Email')).toHaveValue(email);
  await page.getByLabel('Password', { exact: true }).fill(testPassword);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Welcome back!')).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Diary' })).toBeVisible();
});

test('T-E2E-1: Flow 1: after 5 wrong tries, a 15-minute wait', async ({ page }) => {
  const user = await createUser('e2e-lockout');
  await page.goto('/log-in');
  await page.getByLabel('Email').fill(user.email);
  for (let i = 0; i < 5; i += 1) {
    await page.getByLabel('Password', { exact: true }).fill(`wrong-${i}-password1`);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByText(/Email or password is incorrect\.|Too many tries/)).toBeVisible();
  }
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Log in' }).click({ trial: false }).catch(() => undefined);
  await expect(page.getByText('Too many tries. Please wait 15 minutes and try again.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log in' })).toBeDisabled();
});

test('T-E2E-1: Flow 1: a confirmed User logs in and sees "Welcome back!"', async ({ page }) => {
  const user = await createUser('e2e-flow1-login');
  await logIn(page, user.email, user.password);
  await expect(page.getByText('Welcome back!')).toBeVisible();
});
