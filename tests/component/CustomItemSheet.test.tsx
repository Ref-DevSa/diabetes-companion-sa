import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as checklistData from '../../src/data/checklist';
import { ok } from '../../src/lib/errors';
import { CustomItemSheet } from '../../src/modals/CustomItemSheet';
import { eveningWalk } from '../helpers/checklistFixtures';
import { renderWithProviders } from '../helpers/render';

vi.mock('../../src/data/checklist', () => ({
  getTodayChecklist: vi.fn(),
  tickItem: vi.fn(),
  untickItem: vi.fn(),
  addCustomItem: vi.fn(),
  renameCustomItem: vi.fn(),
  deleteCustomItem: vi.fn(),
}));

const addCustomItem = vi.mocked(checklistData.addCustomItem);
const renameCustomItem = vi.mocked(checklistData.renameCustomItem);

function openSheet(options: { item?: typeof eveningWalk; existingNames?: string[] } = {}) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  renderWithProviders(
    <CustomItemSheet item={options.item} existingNames={options.existingNames ?? []} onClose={onClose} onSaved={onSaved} />,
  );
  return { onClose, onSaved, user: userEvent.setup() };
}

describe('M5 Add or edit Custom Item', () => {
  beforeEach(() => {
    addCustomItem.mockReset();
    renameCustomItem.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it('T-M5-1: add mode: the "Item name" field with "e.g. Evening walk", Save and Cancel', () => {
    openSheet();
    expect(screen.getByRole('dialog', { name: 'Add my own item' })).toBeInTheDocument();
    expect(screen.getByLabelText('Item name')).toHaveAttribute('placeholder', 'e.g. Evening walk');
    expect(screen.getByLabelText('Item name')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('T-M5-1: edit mode shows the current name', () => {
    openSheet({ item: eveningWalk, existingNames: ['Evening walk'] });
    expect(screen.getByRole('dialog', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByLabelText('Item name')).toHaveValue('Evening walk');
  });

  it('T-US10-1: "Evening walk" + Save adds the Item and hands it back', async () => {
    addCustomItem.mockResolvedValue(ok(eveningWalk));
    const { user, onSaved } = openSheet();
    await user.type(screen.getByLabelText('Item name'), '  Evening walk ');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(addCustomItem).toHaveBeenCalledWith('Evening walk');
    expect(onSaved).toHaveBeenCalledWith(eveningWalk, 'added');
  });

  it('T-US10-2: "evening walk" when "Evening walk" exists shows "You already have an item with this name."', async () => {
    const { user } = openSheet({ existingNames: ['Evening walk'] });
    await user.type(screen.getByLabelText('Item name'), 'evening walk');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    const message = screen.getByText('You already have an item with this name.');
    expect(screen.getByLabelText('Item name')).toHaveAttribute('aria-describedby', message.id);
    expect(addCustomItem).not.toHaveBeenCalled();
  });

  it('T-US10-2: the database refusing a duplicate shows the same message', async () => {
    addCustomItem.mockResolvedValue({ ok: false, code: 'item_name_taken' });
    const { user, onSaved } = openSheet();
    await user.type(screen.getByLabelText('Item name'), 'Evening walk');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('You already have an item with this name.')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('T-M5-2: an empty name shows "Enter a name for your item."; 61 characters shows the length message', async () => {
    const { user } = openSheet();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Enter a name for your item.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Item name'), 'a'.repeat(61));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Item names can be up to 60 characters.')).toBeInTheDocument();
    expect(addCustomItem).not.toHaveBeenCalled();
  });

  it('T-M5-2: the database refusing a 7th Item shows "You can add up to 6 of your own items."', async () => {
    addCustomItem.mockResolvedValue({ ok: false, code: 'custom_item_limit' });
    const { user } = openSheet();
    await user.type(screen.getByLabelText('Item name'), 'Seventh');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('You can add up to 6 of your own items.')).toBeInTheDocument();
  });

  it('T-M5-2: while saving, "Save" shows "Saving…" and is disabled', async () => {
    addCustomItem.mockReturnValue(new Promise(() => undefined));
    const { user } = openSheet();
    await user.type(screen.getByLabelText('Item name'), 'Evening walk');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  });

  it('T-M5-3: offline: "You\'re offline. Reconnect and try again." and "Save" is disabled (D6)', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    openSheet();
    expect(screen.getByText("You're offline. Reconnect and try again.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.queryByText(/save your ticks/i)).not.toBeInTheDocument();
  });

  it('T-US10-4: renaming saves the new name and hands back the Item; the old name may keep new capitals', async () => {
    const renamed = { ...eveningWalk, name: 'Evening Walk' };
    renameCustomItem.mockResolvedValue(ok(renamed));
    const { user, onSaved } = openSheet({ item: eveningWalk, existingNames: ['Evening walk'] });
    await user.clear(screen.getByLabelText('Item name'));
    await user.type(screen.getByLabelText('Item name'), 'Evening Walk');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(renameCustomItem).toHaveBeenCalledWith('custom-walk', 'Evening Walk');
    expect(onSaved).toHaveBeenCalledWith(renamed, 'updated');
  });

  it('M5: "Cancel" closes without saving', async () => {
    const { user, onClose } = openSheet();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
