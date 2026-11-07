import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../src/App';
import * as readingsData from '../../src/data/readings';
import en from '../../src/i18n/en.json';
import { ok } from '../../src/lib/errors';
import { fakeReadings, manyReadings } from '../helpers/readingFixtures';
import { fakeSession, renderWithProviders } from '../helpers/render';

vi.mock('../../src/data/readings', () => ({
  listReadings: vi.fn(),
  addReading: vi.fn(),
  updateReading: vi.fn(),
  deleteReading: vi.fn(),
}));

const listReadings = vi.mocked(readingsData.listReadings);
const addReading = vi.mocked(readingsData.addReading);
const updateReading = vi.mocked(readingsData.updateReading);
const deleteReading = vi.mocked(readingsData.deleteReading);
const friendly = Object.values(en.friendly);
const lowMessage = 'Your reading is low. Follow your care plan and talk to your clinic.';
const veryHighMessage = 'Your reading is very high. Talk to your clinic today.';

function openDiary() {
  return renderWithProviders(<AppRoutes />, { route: '/diary', auth: { session: fakeSession } });
}

/** The card for one Reading, found by its value. */
function card(value: string) {
  const valueText = screen.getByText(value, { selector: '[data-part="value"]' });
  return valueText.closest('article') as HTMLElement;
}

async function addThroughSheet(user: ReturnType<typeof userEvent.setup>, value: string, when: string) {
  await user.click(screen.getAllByRole('button', { name: 'Add reading' })[0]!);
  await user.type(screen.getByLabelText('Reading (mmol/L)'), value);
  await user.selectOptions(screen.getByLabelText('When'), when);
  await user.click(screen.getByRole('button', { name: 'Save' }));
}

describe('S8 Glucose Diary', () => {
  beforeEach(() => {
    listReadings.mockReset().mockResolvedValue(ok({ readings: fakeReadings, hasMore: false }));
    addReading.mockReset();
    updateReading.mockReset();
    deleteReading.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it('T-S8-4: title "My Diary", the Reading cards newest first, "Add reading"; Diary tab active', async () => {
    openDiary();
    expect(await screen.findByRole('heading', { level: 1, name: 'My Diary' })).toBeInTheDocument();
    await screen.findByText('6.8', { selector: '[data-part="value"]' });
    const values = [...document.querySelectorAll('[data-part="value"]')].map((el) => el.textContent);
    expect(values).toEqual(['6.8', '3.6', '9.4', '14.6', '7.2']);
    expect(within(card('6.8')).getByText('27 Oct 2026, 07:10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add reading' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Diary' })).toHaveAttribute('aria-current', 'page');
    expect(listReadings).toHaveBeenCalledWith(0);
  });

  it('T-US7-1: 3.6 Bedtime shows an orange "Low" badge with an icon and the low message', async () => {
    openDiary();
    await screen.findByText('3.6', { selector: '[data-part="value"]' });
    const low = card('3.6');
    expect(within(low).getByText('Low').closest('[data-flag]')).toHaveClass('text-warning');
    expect(within(low).getByText(lowMessage)).toBeInTheDocument();
  });

  it('T-US7-2: 14.6 Fasting shows a red "Very high" badge and the very-high message', async () => {
    openDiary();
    await screen.findByText('14.6', { selector: '[data-part="value"]' });
    const high = card('14.6');
    expect(within(high).getByText('Very high').closest('[data-flag]')).toHaveClass('text-error');
    expect(within(high).getByText(veryHighMessage)).toBeInTheDocument();
  });

  it('T-US7-3: 14.6 After a meal shows no badge (the fasting limit does not apply)', async () => {
    listReadings.mockResolvedValue(ok({ readings: [{ ...fakeReadings[3]!, when: 'after_meal' }], hasMore: false }));
    openDiary();
    await screen.findByText('14.6', { selector: '[data-part="value"]' });
    expect(within(card('14.6')).queryByText('Very high')).not.toBeInTheDocument();
  });

  it('T-US6-1: saving 6.8 Fasting closes M1, puts the Reading at the top and shows a BR14 message', async () => {
    const saved = { id: 'new', value: 6.8, when: 'fasting' as const, takenAt: new Date().toISOString(), note: null };
    addReading.mockResolvedValue(ok(saved));
    const user = userEvent.setup();
    openDiary();
    await screen.findByText('3.6', { selector: '[data-part="value"]' });
    await addThroughSheet(user, '6.8', 'fasting');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.querySelector('[data-part="value"]')?.closest('article')).toHaveAttribute('data-reading-id', 'new');
    const toastTexts = screen.getAllByRole('status').map((s) => s.textContent ?? '');
    expect(toastTexts.some((text) => friendly.includes(text))).toBe(true);
  });

  it('T-US7-1 / T-BR6-2: saving a Low Reading shows the low message, never a friendly one', async () => {
    const saved = { id: 'low', value: 3.6, when: 'bedtime' as const, takenAt: new Date().toISOString(), note: null };
    addReading.mockResolvedValue(ok(saved));
    const user = userEvent.setup();
    openDiary();
    await screen.findByText('6.8', { selector: '[data-part="value"]' });
    await addThroughSheet(user, '3.6', 'bedtime');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const toastTexts = screen.getAllByRole('status').map((s) => s.textContent ?? '');
    expect(toastTexts).toContain(lowMessage);
    expect(toastTexts.some((text) => friendly.includes(text))).toBe(false);
  });

  it('T-US7-4 / T-US8-2: editing 3.6 to 5.2 removes the badge and shows "Reading updated."', async () => {
    updateReading.mockResolvedValue(ok({ ...fakeReadings[1]!, value: 5.2 }));
    const user = userEvent.setup();
    openDiary();
    await screen.findByText('3.6', { selector: '[data-part="value"]' });
    await user.click(within(card('3.6')).getByRole('button', { name: 'Edit' }));
    await user.clear(screen.getByLabelText('Reading (mmol/L)'));
    await user.type(screen.getByLabelText('Reading (mmol/L)'), '5.2');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Reading updated.')).toBeInTheDocument();
    expect(within(card('5.2')).queryByText('Low')).not.toBeInTheDocument();
    expect(screen.queryByText('3.6', { selector: '[data-part="value"]' })).not.toBeInTheDocument();
  });

  it('T-US8-1: with 25 Readings, the newest 20 show first and "Load more" shows the rest', async () => {
    const all = manyReadings(25);
    listReadings.mockImplementation(async (offset: number) => ok({ readings: all.slice(offset, offset + 20), hasMore: offset + 20 < all.length }));
    const user = userEvent.setup();
    openDiary();
    await screen.findByText(all[0]!.value.toFixed(1), { selector: '[data-part="value"]' });
    expect(document.querySelectorAll('article[data-reading-id]')).toHaveLength(20);
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    await waitFor(() => expect(document.querySelectorAll('article[data-reading-id]')).toHaveLength(25));
    expect(listReadings).toHaveBeenLastCalledWith(20);
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('T-US8-3: "Delete" then "Delete reading" in M4 removes the Reading and shows "Reading deleted."', async () => {
    deleteReading.mockResolvedValue(ok(undefined));
    const user = userEvent.setup();
    openDiary();
    await screen.findByText('9.4', { selector: '[data-part="value"]' });
    await user.click(within(card('9.4')).getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('dialog', { name: 'Delete this reading?' })).toHaveTextContent('26 Oct 2026, 19:45 · 9.4 mmol/L (After a meal)');
    await user.click(screen.getByRole('button', { name: 'Delete reading' }));
    expect(deleteReading).toHaveBeenCalledWith('r3');
    expect(await screen.findByText('Reading deleted.')).toBeInTheDocument();
    expect(screen.queryByText('9.4', { selector: '[data-part="value"]' })).not.toBeInTheDocument();
  });

  it('T-US8-3: if the delete fails, M4 shows the PRD message and the Reading stays', async () => {
    deleteReading.mockResolvedValue({ ok: false, code: 'offline' });
    const user = userEvent.setup();
    openDiary();
    await screen.findByText('9.4', { selector: '[data-part="value"]' });
    await user.click(within(card('9.4')).getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Delete reading' }));
    expect(await screen.findByText("Couldn't delete this reading. Check your connection and try again.")).toBeInTheDocument();
    expect(screen.getByText('9.4', { selector: '[data-part="value"]' })).toBeInTheDocument();
  });

  it('T-US8-4: no Readings shows the empty message and the "Add reading" button', async () => {
    listReadings.mockResolvedValue(ok({ readings: [], hasMore: false }));
    const user = userEvent.setup();
    openDiary();
    expect(await screen.findByText('No readings yet. Tap “Add reading” to save your first one.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add reading' }));
    expect(screen.getByRole('dialog', { name: 'Add a reading' })).toBeInTheDocument();
  });

  it('T-S8-1: Loading shows three grey card placeholders', () => {
    listReadings.mockReturnValue(new Promise(() => undefined));
    openDiary();
    expect(screen.getByTestId('loading-placeholder').querySelectorAll('[data-shape="card"]')).toHaveLength(3);
  });

  it('T-S8-2: Error shows "We couldn\'t load your Diary. Please try again." and "Try again" reloads', async () => {
    listReadings.mockResolvedValueOnce({ ok: false, code: 'server' });
    openDiary();
    expect(await screen.findByText("We couldn't load your Diary. Please try again.")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('6.8', { selector: '[data-part="value"]' })).toBeInTheDocument();
  });

  it('T-S8-3: Offline: the banner shows and "Add reading", "Edit" and "Delete" are disabled', async () => {
    openDiary();
    await screen.findByText('6.8', { selector: '[data-part="value"]' });
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText("You're offline. Some things may not work until you reconnect.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add reading' })).toBeDisabled();
    for (const button of screen.getAllByRole('button', { name: 'Edit' })) expect(button).toBeDisabled();
    for (const button of screen.getAllByRole('button', { name: 'Delete' })) expect(button).toBeDisabled();
  });

  it('T-M1-4: a Reading deleted on another phone: "This reading no longer exists.", M1 closes, the Diary reloads', async () => {
    updateReading.mockResolvedValue({ ok: false, code: 'not_found' });
    const user = userEvent.setup();
    openDiary();
    await screen.findByText('6.8', { selector: '[data-part="value"]' });
    await user.click(within(card('6.8')).getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('This reading no longer exists.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(listReadings).toHaveBeenCalledTimes(2));
  });
});
