// T-NFR-8: axe-core finds no serious or critical violation on S1 to S11 and M1 to M5.
// T-NFR-12: every tappable thing is at least 44 x 44 px and has a text label.
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { addReadings, loggedInUser, removeCreatedUsers } from './helpers';

test.afterAll(removeCreatedUsers);

async function seriousViolations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
}

/** Visible controls smaller than 44 x 44 px, or without a text label. Inline links inside a sentence are exempt (WCAG 2.5.8). */
async function tapProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problems: string[] = [];
    const controls = document.querySelectorAll<HTMLElement>('a[href], button, select, input:not([type="hidden"]), textarea, [role="button"]');
    for (const el of controls) {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 1 && rect.height <= 1) continue; // not shown
      if (getComputedStyle(el).visibility === 'hidden') continue;
      const describe = `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}"`;
      const inSentence =
        el.tagName === 'A' &&
        getComputedStyle(el).display === 'inline' &&
        (el.parentElement?.textContent ?? '').replace(el.textContent ?? '', '').trim() !== '';
      const target = el.matches('input[type="checkbox"], input[type="radio"]') ? (el.closest('label') ?? el) : el;
      const box = target.getBoundingClientRect();
      if (!inSentence && (box.width < 43.5 || box.height < 43.5)) problems.push(`${describe} is ${Math.round(box.width)} x ${Math.round(box.height)} px`);
      const labelledBy = el.getAttribute('aria-labelledby');
      const name =
        el.getAttribute('aria-label') ||
        (labelledBy ? labelledBy.split(' ').map((id) => document.getElementById(id)?.textContent ?? '').join(' ') : '') ||
        (el as HTMLInputElement).labels?.[0]?.textContent ||
        el.textContent ||
        el.getAttribute('title') ||
        '';
      if (name.trim() === '') problems.push(`${describe} has no text label`);
    }
    return problems;
  });
}

async function check(page: Page, what: string) {
  expect(await seriousViolations(page), `axe on ${what}`).toEqual([]);
  expect(await tapProblems(page), `touch targets on ${what}`).toEqual([]);
}

test('T-NFR-8 / T-NFR-12: Visitor screens S1 to S7 and M2, with their error states', async ({ page }) => {
  for (const [what, path] of [
    ['S1', '/'],
    ['S5', '/learn'],
    ['S6', '/safety'],
    ['S7', '/help'],
    ['S3', '/log-in'],
    ['S4', '/forgot-password'],
    ['S2', '/sign-up'],
  ]) {
    await page.goto(path!);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await check(page, what!);
  }
  // S2 with every field error showing.
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Please confirm you are 18 or older.')).toBeVisible();
  await check(page, 'S2 errors');
  // M2 from S2.
  await page.getByRole('button', { name: 'Privacy Notice' }).click();
  await expect(page.getByRole('dialog', { name: 'Privacy Notice' })).toBeVisible();
  await check(page, 'M2');
  await page.getByRole('button', { name: 'Close' }).click();
  // S5 with a Topic open.
  await page.goto('/learn');
  await page.getByRole('button', { name: /What is diabetes\?/ }).click();
  await check(page, 'S5 Topic open');
});

test('T-NFR-8 / T-NFR-12: User screens S8 to S11 and M1, M3, M4, M5, with their error states', async ({ page }) => {
  const user = await loggedInUser(page, 'a11y');
  await addReadings(user.id, [
    [3.6, 'bedtime'],
    [14.6, 'fasting'],
  ]);

  await page.goto('/diary');
  await expect(page.locator('article').first()).toBeVisible();
  await check(page, 'S8');
  await page.getByRole('button', { name: 'Add reading' }).click();
  await check(page, 'M1');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Enter a number from 1.0 to 40.0.')).toBeVisible();
  await check(page, 'M1 errors');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.locator('article').first().getByRole('button', { name: 'Delete' }).click();
  await check(page, 'M4');
  await page.getByRole('button', { name: 'Cancel' }).click();

  await page.goto('/checklist');
  await expect(page.getByRole('progressbar')).toBeVisible();
  await check(page, 'S9');
  await page.getByRole('button', { name: 'Add my own item' }).click();
  await check(page, 'M5');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Enter a name for your item.')).toBeVisible();
  await check(page, 'M5 errors');
  await page.getByLabel('Item name').fill('Evening walk');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('checkbox', { name: 'Evening walk' })).toBeVisible();
  await check(page, 'S9 with a Custom Item');

  await page.goto('/dashboard');
  await expect(page.getByRole('region', { name: 'Last 7 readings' })).toBeVisible();
  await check(page, 'S10');

  await page.goto('/profile');
  await expect(page.getByRole('heading', { level: 1, name: 'My profile' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await check(page, 'S11');
  await page.getByRole('button', { name: 'Delete account' }).click();
  await check(page, 'M3');
  await page.getByRole('button', { name: 'Cancel' }).click();
});

test('T-NFR-8: S10 empty state', async ({ page }) => {
  await loggedInUser(page, 'a11y-empty');
  await page.goto('/dashboard');
  await expect(page.getByText('No readings yet. Add your first one in the Diary.')).toBeVisible();
  await check(page, 'S10 empty');
});
