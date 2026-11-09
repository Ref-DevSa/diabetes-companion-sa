import { expect, test } from '@playwright/test';
import { addReadings, loggedInUser, removeCreatedUsers, warningSigns } from './helpers';

test.afterAll(removeCreatedUsers);

test('T-NAV-5: tapping the active tab scrolls to the top', async ({ page }) => {
  await page.goto('/learn');
  await expect(page.getByRole('button', { name: /What is diabetes\?/ })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  await page.getByRole('navigation').getByRole('link', { name: 'Learn' }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page).toHaveURL(/\/learn$/);
});

for (const tab of ['Diary', 'Checklist', 'Dashboard']) {
  test(`T-NAV-6: a Visitor tapping ${tab} goes to S3`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation').getByRole('link', { name: tab }).click();
    await expect(page).toHaveURL(/\/log-in$/);
    await expect(page.getByText('Log in to use this part of the app.')).toBeVisible();
  });
}

test('T-NAV-7: "Warning signs" opens S6 from every Visitor screen (S1 to S7)', async ({ page }) => {
  for (const path of ['/', '/sign-up', '/log-in', '/forgot-password', '/learn', '/safety', '/help']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await warningSigns(page).click();
    await expect(page, path).toHaveURL(/\/safety$/);
    await expect(page.getByRole('region', { name: 'In an emergency, get help now' })).toBeVisible();
  }
});

test('T-NAV-7: "Warning signs" opens S6 from every User screen (S8 to S11)', async ({ page }) => {
  await loggedInUser(page, 'nav-warning');
  for (const path of ['/diary', '/checklist', '/dashboard', '/profile']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await warningSigns(page).click();
    await expect(page, path).toHaveURL(/\/safety$/);
  }
});

test('T-NAV-8: every "Cancel" and "Close" returns to the screen that opened the pop-up', async ({ page }) => {
  // M2 from S2.
  await page.goto('/sign-up');
  await page.getByRole('button', { name: 'Privacy Notice' }).click();
  await page.getByRole('dialog', { name: 'Privacy Notice' }).getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/sign-up$/);

  const user = await loggedInUser(page, 'nav-cancel');
  await addReadings(user.id, [[6.8, 'fasting']]);

  // M1 and M4 from S8.
  await page.goto('/diary');
  await page.getByRole('button', { name: 'Add reading' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/diary$/);
  await page.locator('article').first().getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('article')).toHaveCount(1);

  // M5 from S9.
  await page.goto('/checklist');
  await page.getByRole('button', { name: 'Add my own item' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/checklist$/);

  // M2 and M3 from S11.
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Privacy Notice' }).click();
  await page.getByRole('dialog', { name: 'Privacy Notice' }).getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await page.getByRole('button', { name: 'Delete account' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/profile$/);

  // Escape closes a pop-up too (keyboard use).
  await page.goto('/diary');
  await page.getByRole('button', { name: 'Add reading' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
