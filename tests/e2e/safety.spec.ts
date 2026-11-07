import { expect, test } from '@playwright/test';

const emergencyText = 'Call 112 from a cell phone or 10177 for an ambulance, or go to the nearest hospital. Do not wait for this app.';

test.describe('US13 Safety Guide in a real browser', () => {
  for (const start of ['/', '/learn', '/sign-up']) {
    test(`T-US13-1: from ${start}, the red "Warning signs" button opens S6 with the emergency box at the top`, async ({ page }) => {
      await page.goto(start);
      await page.getByRole('banner').getByRole('link', { name: 'Warning signs', exact: true }).click();
      await expect(page).toHaveURL(/\/safety$/);
      const box = page.getByRole('region', { name: 'In an emergency, get help now' });
      await expect(box).toBeVisible();
      const boxTop = (await box.boundingBox())?.y ?? Infinity;
      const noteTop = (await page.getByText('Symptoms alone cannot confirm diabetes.').boundingBox())?.y ?? 0;
      expect(boxTop).toBeLessThan(noteTop);
    });
  }

  test('T-US13-2: S6 shows the call-for-help text and the three lists from the database', async ({ page }) => {
    await page.goto('/safety');
    await expect(page.getByRole('region', { name: 'In an emergency, get help now' })).toContainText(emergencyText);
    await expect(page.getByText('Shaking or feeling jittery')).toBeVisible();
    await expect(page.getByText('Feeling very thirsty')).toBeVisible();
    await expect(page.getByText('They have a fit (seizure)')).toBeVisible();
  });

  test('T-US13-3: offline, the box and the banner show and the lists are replaced by the offline message', async ({ page, context }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Understand diabetes. Track your day.' })).toBeVisible();
    await context.setOffline(true);
    await page.getByRole('banner').getByRole('link', { name: 'Warning signs', exact: true }).click();
    await expect(page.getByRole('region', { name: 'In an emergency, get help now' })).toContainText(emergencyText);
    await expect(page.getByText("You're offline. Some things may not work until you reconnect.")).toBeVisible();
    await expect(page.getByText("You're offline. The emergency numbers above still work.")).toBeVisible();
    await context.setOffline(false);
  });

  test('T-US13-4: S6 shows "Symptoms alone cannot confirm diabetes. Only a test at a clinic can."', async ({ page }) => {
    await page.goto('/safety');
    await expect(page.getByText('Symptoms alone cannot confirm diabetes. Only a test at a clinic can.')).toBeVisible();
  });
});
