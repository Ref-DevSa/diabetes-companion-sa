import { expect, test } from '@playwright/test';

// T-NFR-1 (PRD 12.1): placeholders at once; the error state after 3 seconds if the server does not answer.
const screens: Array<[string, string, string]> = [
  ['S5', '/learn', "We couldn't load the Topics. Please try again."],
  ['S7', '/help', "We couldn't load this page. Please try again."],
];

for (const [id, path, error] of screens) {
  test(`T-NFR-1: ${id} shows placeholders at once and its error after 3 seconds when the server does not answer`, async ({ page }) => {
    await page.route('**/rest/v1/**', () => {
      // Never answer: the server is too slow.
    });
    await page.goto(path);
    const placeholders = page.getByTestId('loading-placeholder');
    await expect(placeholders).toBeVisible({ timeout: 1000 });
    const shownAt = Date.now();
    await expect(page.getByText(error)).toBeVisible({ timeout: 5000 });
    const waited = Date.now() - shownAt;
    expect(waited).toBeGreaterThanOrEqual(2500);
    expect(waited).toBeLessThan(4500);
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
}
