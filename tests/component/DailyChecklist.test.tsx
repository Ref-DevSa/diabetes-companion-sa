import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../src/App';
import * as checklistData from '../../src/data/checklist';
import { ok, type Result } from '../../src/lib/errors';
import { checklist, customItems, eveningWalk, standardItems, thaboChecklist } from '../helpers/checklistFixtures';
import { fakeSession, renderWithProviders } from '../helpers/render';

vi.mock('../../src/data/checklist', () => ({
  getTodayChecklist: vi.fn(),
  tickItem: vi.fn(),
  untickItem: vi.fn(),
  addCustomItem: vi.fn(),
  renameCustomItem: vi.fn(),
  deleteCustomItem: vi.fn(),
}));

const getToday = vi.mocked(checklistData.getTodayChecklist);
const tickItem = vi.mocked(checklistData.tickItem);
const untickItem = vi.mocked(checklistData.untickItem);
const addCustomItem = vi.mocked(checklistData.addCustomItem);
const renameCustomItem = vi.mocked(checklistData.renameCustomItem);
const deleteCustomItem = vi.mocked(checklistData.deleteCustomItem);
const note = 'This is your own routine. Always follow the care plan from your clinic.';

function openChecklist() {
  return renderWithProviders(<AppRoutes />, { route: '/checklist', auth: { session: fakeSession } });
}

function box(name: string) {
  return screen.getByRole('checkbox', { name });
}

function row(name: string) {
  return box(name).closest('li') as HTMLElement;
}

describe('S9 Daily Checklist', () => {
  beforeEach(() => {
    getToday.mockReset().mockResolvedValue(ok(thaboChecklist));
    tickItem.mockReset().mockResolvedValue(ok(undefined));
    untickItem.mockReset().mockResolvedValue(ok(undefined));
    addCustomItem.mockReset();
    renameCustomItem.mockReset();
    deleteCustomItem.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it('T-S9-1: title "Today" with the date, the progress card, the Items in order, the note; Checklist tab active', async () => {
    openChecklist();
    expect(await screen.findByRole('heading', { level: 1, name: 'Today' })).toBeInTheDocument();
    expect(screen.getByText('Tue 27 Oct 2026')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveTextContent('2 of 5');
    expect(screen.getByText('2 of 5 done')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox').map((c) => c.closest('li')?.querySelector('[data-part="name"]')?.textContent)).toEqual([
      'Take my medication as prescribed',
      'Check my glucose if my care plan says so',
      'Drink water',
      'Do suitable physical activity',
      'Evening walk',
    ]);
    expect(box('Take my medication as prescribed')).toBeChecked();
    expect(box('Drink water')).toBeChecked();
    expect(box('Evening walk')).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Add my own item' })).toBeInTheDocument();
    expect(screen.getByText(note)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Checklist' })).toHaveAttribute('aria-current', 'page');
  });

  it('T-BR10-1: Standard Items show their translated name (by key); only Custom Items have Edit and Delete', async () => {
    getToday.mockResolvedValue(ok(checklist([{ ...standardItems[0]!, name: 'stored name' }, eveningWalk])));
    openChecklist();
    expect(await screen.findByRole('checkbox', { name: 'Take my medication as prescribed' })).toBeInTheDocument();
    expect(within(row('Take my medication as prescribed')).queryByRole('button')).not.toBeInTheDocument();
    expect(within(row('Evening walk')).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(within(row('Evening walk')).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('T-US9-1: ticking "Drink water" shows it ticked, fills the ring and says "1 of 4 done"', async () => {
    getToday.mockResolvedValue(ok(checklist(standardItems)));
    const user = userEvent.setup();
    openChecklist();
    await user.click(await screen.findByRole('checkbox', { name: 'Drink water' }));
    expect(tickItem).toHaveBeenCalledWith('std-water');
    await waitFor(() => expect(box('Drink water')).toBeChecked());
    expect(screen.getByText('1 of 4 done')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  });

  it('T-BR23-2: the tick shows as saved only after the database confirms', async () => {
    getToday.mockResolvedValue(ok(checklist(standardItems)));
    let finish: (value: Result) => void = () => undefined;
    tickItem.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const user = userEvent.setup();
    openChecklist();
    await user.click(await screen.findByRole('checkbox', { name: 'Drink water' }));
    expect(box('Drink water')).not.toBeChecked();
    expect(box('Drink water')).toBeDisabled();
    await act(async () => finish(ok(undefined)));
    expect(box('Drink water')).toBeChecked();
  });

  it('T-BR23-2: if saving the tick fails, it is undone and the error shows', async () => {
    getToday.mockResolvedValue(ok(checklist(standardItems)));
    tickItem.mockResolvedValue({ ok: false, code: 'server' });
    const user = userEvent.setup();
    openChecklist();
    await user.click(await screen.findByRole('checkbox', { name: 'Drink water' }));
    expect(await screen.findByText('Something went wrong on our side. Please try again.')).toBeInTheDocument();
    expect(box('Drink water')).not.toBeChecked();
    expect(screen.getByText('0 of 4 done')).toBeInTheDocument();
  });

  it('T-US9-2: ticking the last of 4 shows "All done today. Nice work!"', async () => {
    getToday.mockResolvedValue(ok(checklist(standardItems, ['std-medication', 'std-glucose', 'std-water'])));
    const user = userEvent.setup();
    openChecklist();
    await user.click(await screen.findByRole('checkbox', { name: 'Do suitable physical activity' }));
    expect(await screen.findByText('All done today. Nice work!')).toBeInTheDocument();
  });

  it('T-INT-4: unticking removes the tick and the count goes down', async () => {
    const user = userEvent.setup();
    openChecklist();
    await user.click(await screen.findByRole('checkbox', { name: 'Drink water' }));
    expect(untickItem).toHaveBeenCalledWith('std-water');
    await waitFor(() => expect(box('Drink water')).not.toBeChecked());
    expect(screen.getByText('1 of 5 done')).toBeInTheDocument();
  });

  it('T-US9-3: offline, a tick is undone and "You\'re offline. Reconnect to save your ticks." shows', async () => {
    const user = userEvent.setup();
    openChecklist();
    await screen.findByRole('checkbox', { name: 'Drink water' });
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await user.click(box('Evening walk'));
    expect(await screen.findByText("You're offline. Reconnect to save your ticks.")).toBeInTheDocument();
    expect(box('Evening walk')).not.toBeChecked();
    expect(tickItem).not.toHaveBeenCalled();
  });

  it('T-US9-4: on a new day every Item shows unticked', async () => {
    getToday.mockResolvedValue(ok(checklist([...standardItems, eveningWalk], [], '2026-10-28')));
    openChecklist();
    await screen.findByText('Wed 28 Oct 2026');
    for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).not.toBeChecked();
    expect(screen.getByText('0 of 5 done')).toBeInTheDocument();
  });

  it('T-US10-1: "Add my own item", "Evening walk", Save: it appears after the four Standard Items, "0 of 5 done"', async () => {
    getToday.mockResolvedValue(ok(checklist(standardItems)));
    addCustomItem.mockResolvedValue(ok(eveningWalk));
    const user = userEvent.setup();
    openChecklist();
    await user.click(await screen.findByRole('button', { name: 'Add my own item' }));
    await user.type(screen.getByLabelText('Item name'), 'Evening walk');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(addCustomItem).toHaveBeenCalledWith('Evening walk');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const names = screen.getAllByRole('checkbox').map((c) => c.closest('li')?.querySelector('[data-part="name"]')?.textContent);
    expect(names.at(-1)).toBe('Evening walk');
    expect(screen.getByText('0 of 5 done')).toBeInTheDocument();
    expect(screen.getByText('Item saved.')).toBeInTheDocument();
  });

  it('T-US10-3: with 6 Custom Items, "Add my own item" says "You can add up to 6 of your own items." and M5 does not open', async () => {
    getToday.mockResolvedValue(ok(checklist([...standardItems, ...customItems(6)])));
    const user = userEvent.setup();
    openChecklist();
    await user.click(await screen.findByRole('button', { name: 'Add my own item' }));
    expect(screen.getByText('You can add up to 6 of your own items.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('T-US10-4: renaming a Custom Item shows the new name', async () => {
    renameCustomItem.mockResolvedValue(ok({ ...eveningWalk, name: 'Evening walk 20 min' }));
    const user = userEvent.setup();
    openChecklist();
    await user.click(within(await screen.findByRole('listitem', { name: /Evening walk/ })).getByRole('button', { name: 'Edit' }));
    const field = screen.getByLabelText('Item name');
    expect(field).toHaveValue('Evening walk');
    await user.clear(field);
    await user.type(field, 'Evening walk 20 min');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(renameCustomItem).toHaveBeenCalledWith('custom-walk', 'Evening walk 20 min');
    expect(await screen.findByRole('checkbox', { name: 'Evening walk 20 min' })).toBeInTheDocument();
  });

  it('T-US10-4: deleting a Custom Item removes it and shows "Item deleted." (no Undo, D2)', async () => {
    deleteCustomItem.mockResolvedValue(ok(undefined));
    const user = userEvent.setup();
    openChecklist();
    await user.click(within(await screen.findByRole('listitem', { name: /Evening walk/ })).getByRole('button', { name: 'Delete' }));
    expect(deleteCustomItem).toHaveBeenCalledWith('custom-walk');
    expect(await screen.findByText('Item deleted.')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Evening walk' })).not.toBeInTheDocument();
    expect(screen.getByText('2 of 4 done')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /undo/i })).not.toBeInTheDocument();
  });

  it('OP25: if deleting fails, the Item stays and the server message shows', async () => {
    deleteCustomItem.mockResolvedValue({ ok: false, code: 'server' });
    const user = userEvent.setup();
    openChecklist();
    await user.click(within(await screen.findByRole('listitem', { name: /Evening walk/ })).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Something went wrong on our side. Please try again.')).toBeInTheDocument();
    expect(box('Evening walk')).toBeInTheDocument();
  });

  it('T-S9-2: Loading shows the ring and the Items as grey placeholders', () => {
    getToday.mockReturnValue(new Promise(() => undefined));
    openChecklist();
    const region = screen.getByTestId('loading-placeholder');
    expect(region.querySelectorAll('[data-shape="ring"]')).toHaveLength(1);
    expect(region.querySelectorAll('[data-shape="item"]').length).toBeGreaterThanOrEqual(4);
  });

  it('T-S9-3: Error shows "We couldn\'t load your Checklist. Please try again." and "Try again" reloads', async () => {
    getToday.mockResolvedValueOnce({ ok: false, code: 'server' });
    openChecklist();
    expect(await screen.findByText("We couldn't load your Checklist. Please try again.")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('checkbox', { name: 'Drink water' })).toBeInTheDocument();
  });

  it('T-S9-4: the note shows, and there is no percentage and no Undo (D2)', async () => {
    openChecklist();
    await screen.findByText(note);
    expect(screen.getByRole('main').textContent).not.toContain('%');
    expect(screen.queryByRole('button', { name: /undo/i })).not.toBeInTheDocument();
  });

  it('T-EDGE-7: when 00:00 SAST passes while S9 is open, a toast says so and the Items reload unticked', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      vi.setSystemTime(new Date('2026-10-27T21:59:00Z')); // 23:59 SAST
      openChecklist();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(box('Drink water')).toBeChecked();
      getToday.mockResolvedValue(ok(checklist([...standardItems, eveningWalk], [], '2026-10-28')));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60 * 1000);
      });
      expect(screen.getByText("It's a new day! Your checklist has been reset.")).toBeInTheDocument();
      expect(box('Drink water')).not.toBeChecked();
      expect(screen.getByText('Wed 28 Oct 2026')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
