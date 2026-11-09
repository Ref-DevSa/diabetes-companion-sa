import { expect, test } from '@playwright/test';
import { createUser, logIn, removeCreatedUsers } from './helpers';

test.afterAll(removeCreatedUsers);

const headings: Record<string, string> = {
  '/diary': 'My Diary',
  '/checklist': 'Today',
  '/dashboard': 'My Dashboard',
  '/profile': 'My profile',
};

for (const [path, heading] of Object.entries(headings)) {
  test(`T-EDGE-8: a Visitor opening a saved link to ${path} goes to S3, then to ${path} after logging in`, async ({ page }) => {
    const user = await createUser('e2e-guard');
    await page.goto(path);
    await expect(page).toHaveURL(/\/log-in$/);
    await expect(page.getByText('Log in to use this part of the app.')).toBeVisible();
    await logIn(page, user.email, user.password, '');
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  });
}
