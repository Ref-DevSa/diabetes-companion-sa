import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as readingsData from '../../src/data/readings';
import { ok } from '../../src/lib/errors';
import { ReadingSheet } from '../../src/modals/ReadingSheet';
import { fakeReadings } from '../helpers/readingFixtures';
import { renderWithProviders } from '../helpers/render';

vi.mock('../../src/data/readings', () => ({
  listReadings: vi.fn(),
  addReading: vi.fn(),
  updateReading: vi.fn(),
  deleteReading: vi.fn(),
}));

const addReading = vi.mocked(readingsData.addReading);
const updateReading = vi.mocked(readingsData.updateReading);
// 27 Oct 2026, 09:41 SAST
const NOW = new Date('2026-10-27T07:41:00Z');

function openSheet(reading?: (typeof fakeReadings)[0]) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  const onGone = vi.fn();
  renderWithProviders(<ReadingSheet reading={reading} onClose={onClose} onSaved={onSaved} onGone={onGone} />);
  return { onClose, onSaved, onGone, user: userEvent.setup() };
}

async function fill(user: ReturnType<typeof userEvent.setup>, value: string, when?: string) {
  await user.type(screen.getByLabelText('Reading (mmol/L)'), value);
  if (when) await user.selectOptions(screen.getByLabelText('When'), when);
}

describe('M1 Add or edit Reading', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    addReading.mockReset();
    updateReading.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('T-M1-1: add mode: title, the five fields with their defaults, Save and Cancel', () => {
    openSheet();
    expect(screen.getByRole('dialog', { name: 'Add a reading' })).toBeInTheDocument();
    expect(screen.getByLabelText('Reading (mmol/L)')).toHaveAttribute('placeholder', 'e.g. 6.8');
    expect(screen.getByLabelText('Reading (mmol/L)')).toHaveAttribute('inputmode', 'decimal');
    const when = screen.getByLabelText('When') as HTMLSelectElement;
    expect(when.value).toBe('');
    expect([...when.options].map((o) => o.text)).toEqual(['Choose when', 'Fasting', 'Before a meal', 'After a meal', 'Bedtime', 'Other']);
    expect(screen.getByLabelText('Date')).toHaveValue('2026-10-27');
    expect(screen.getByLabelText('Time')).toHaveValue('09:41');
    expect(screen.getByLabelText('Note')).toHaveAttribute('placeholder', 'Anything to remember? (optional)');
    expect(screen.getByText('0/200')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('T-M1-1: edit mode: title "Edit reading" and the Reading\'s values', () => {
    openSheet(fakeReadings[1]);
    expect(screen.getByRole('dialog', { name: 'Edit reading' })).toBeInTheDocument();
    expect(screen.getByLabelText('Reading (mmol/L)')).toHaveValue('3.6');
    expect(screen.getByLabelText('When')).toHaveValue('bedtime');
    expect(screen.getByLabelText('Date')).toHaveValue('2026-10-26');
    expect(screen.getByLabelText('Time')).toHaveValue('21:30');
    expect(screen.getByLabelText('Note')).toHaveValue('Skipped supper');
    expect(screen.getByText('14/200')).toBeInTheDocument();
  });

  it('T-US6-1: 6.8, Fasting, date and time kept, Save: the Reading is saved and handed back', async () => {
    const saved = { id: 'new', value: 6.8, when: 'fasting' as const, takenAt: '2026-10-27T07:41:00.000Z', note: null };
    addReading.mockResolvedValue(ok(saved));
    const { user, onSaved } = openSheet();
    await fill(user, '6.8', 'fasting');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(addReading).toHaveBeenCalledWith({ value: 6.8, when: 'fasting', takenAt: '2026-10-27T07:41:00.000Z', note: null });
    expect(onSaved).toHaveBeenCalledWith(saved, 'added');
  });

  it('T-US6-2: 45 shows "Enter a number from 1.0 to 40.0." under the field and nothing is saved', async () => {
    const { user } = openSheet();
    await fill(user, '45', 'fasting');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    const message = screen.getByText('Enter a number from 1.0 to 40.0.');
    expect(screen.getByLabelText('Reading (mmol/L)')).toHaveAttribute('aria-describedby', message.id);
    expect(addReading).not.toHaveBeenCalled();
  });

  it('T-US6-2: "6,8" gets the same message (full stop for decimals, PRD 12.1)', async () => {
    const { user } = openSheet();
    await fill(user, '6,8', 'fasting');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Enter a number from 1.0 to 40.0.')).toBeInTheDocument();
  });

  it('T-US6-3: no When shows "Choose when you took this reading."', async () => {
    const { user } = openSheet();
    await fill(user, '6.8');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Choose when you took this reading.')).toBeInTheDocument();
    expect(addReading).not.toHaveBeenCalled();
  });

  it('T-US6-4: a time in the future shows "The date and time can\'t be in the future."', async () => {
    const { user } = openSheet();
    await fill(user, '6.8', 'fasting');
    await user.clear(screen.getByLabelText('Time'));
    await user.type(screen.getByLabelText('Time'), '11:00');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText("The date and time can't be in the future.")).toBeInTheDocument();
    expect(addReading).not.toHaveBeenCalled();
  });

  it('T-M1-2: a note over 200 characters shows "Notes can be up to 200 characters."', async () => {
    const { user } = openSheet();
    await fill(user, '6.8', 'fasting');
    await user.click(screen.getByLabelText('Note'));
    await user.paste('a'.repeat(201));
    expect(screen.getByText('201/200')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Notes can be up to 200 characters.')).toBeInTheDocument();
    expect(addReading).not.toHaveBeenCalled();
  });

  it.each([
    ['daily_limit', "You've reached today's limit of 30 readings. You can add more tomorrow."],
    ['reading_future', "The date and time can't be in the future."],
    ['reading_too_old', 'You can only add readings from the last 30 days.'],
  ] as const)('T-M1-2: when the database refuses with "%s" the PRD message shows and the sheet stays open', async (code, text) => {
    addReading.mockResolvedValue({ ok: false, code });
    const { user, onSaved } = openSheet();
    await fill(user, '6.8', 'fasting');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Reading (mmol/L)')).toHaveValue('6.8');
  });

  it('T-M1-3: while saving, "Save" shows "Saving…" and is disabled', async () => {
    addReading.mockReturnValue(new Promise(() => undefined));
    const { user } = openSheet();
    await fill(user, '6.8', 'fasting');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  });

  it('T-M1-4: offline shows "You\'re offline. Reconnect and try again." and "Save" is disabled', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    openSheet();
    expect(screen.getByText("You're offline. Reconnect and try again.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('T-M1-4: a Reading deleted on another phone: the sheet reports it gone (D5: no "Return to Diary")', async () => {
    updateReading.mockResolvedValue({ ok: false, code: 'not_found' });
    const { user, onGone, onSaved } = openSheet(fakeReadings[0]);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onGone).toHaveBeenCalledTimes(1);
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /return to diary/i })).not.toBeInTheDocument();
  });

  it('T-US8-2: editing saves the changes and hands back the updated Reading', async () => {
    const updated = { ...fakeReadings[1]!, value: 5.2 };
    updateReading.mockResolvedValue(ok(updated));
    const { user, onSaved } = openSheet(fakeReadings[1]);
    await user.clear(screen.getByLabelText('Reading (mmol/L)'));
    await user.type(screen.getByLabelText('Reading (mmol/L)'), '5.2');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(updateReading).toHaveBeenCalledWith('r2', {
      value: 5.2,
      when: 'bedtime',
      takenAt: '2026-10-26T19:30:00.000Z',
      note: 'Skipped supper',
    });
    expect(onSaved).toHaveBeenCalledWith(updated, 'updated');
  });

  it('T-BR23-1: nothing is reported saved until the database confirms; on failure the typed text stays', async () => {
    let finish: (value: Awaited<ReturnType<typeof readingsData.addReading>>) => void = () => undefined;
    addReading.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { user, onSaved } = openSheet();
    await fill(user, '6.8', 'fasting');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSaved).not.toHaveBeenCalled();
    finish({ ok: false, code: 'server' });
    expect(await screen.findByText('Something went wrong on our side. Please try again.')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Reading (mmol/L)')).toHaveValue('6.8');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('M1: "Cancel" closes without saving', async () => {
    const { user, onClose } = openSheet();
    await fill(user, '6.8', 'fasting');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(addReading).not.toHaveBeenCalled();
  });
});
