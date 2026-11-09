// T-E2E-5: PRD 7.1 Flow 5, find the Safety Guide.
import { expect, test } from '@playwright/test';
import { warningSigns } from './helpers';

test('T-E2E-5: Flow 5: "Warning signs" -> S6 with the emergency box first -> S7', async ({ page }) => {
  await page.goto('/learn');
  await warningSigns(page).click();
  await expect(page).toHaveURL(/\/safety$/);
  const box = page.getByRole('region', { name: 'In an emergency, get help now' });
  await expect(box).toBeVisible();
  await expect(page.getByText('Shaking or feeling jittery')).toBeVisible();
  const boxTop = (await box.boundingBox())?.y ?? Infinity;
  const listTop = (await page.getByText('Shaking or feeling jittery').boundingBox())?.y ?? 0;
  expect(boxTop).toBeLessThan(listTop);
  await page.getByRole('link', { name: 'Find help and trusted links' }).click();
  await expect(page).toHaveURL(/\/help$/);
});
