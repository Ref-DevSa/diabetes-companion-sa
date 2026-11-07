import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteReadingDialog } from '../../src/modals/DeleteReadingDialog';
import { fakeReadings } from '../helpers/readingFixtures';

const bedtime36 = fakeReadings[1]!;

describe('M4 Delete Reading confirmation', () => {
  it('T-M4-1: the title, the Reading in the text, and the buttons as in PRD M4', () => {
    render(<DeleteReadingDialog reading={bedtime36} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'Delete this reading?' });
    expect(dialog).toHaveTextContent('26 Oct 2026, 21:30 · 3.6 mmol/L (Bedtime). This cannot be undone.');
    expect(screen.getByRole('button', { name: 'Delete reading' })).toHaveClass('bg-error');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('T-M4-1: Loading shows "Deleting…"', () => {
    render(<DeleteReadingDialog reading={bedtime36} loading onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
  });

  it('T-M4-1: Error or offline shows the PRD message', () => {
    render(<DeleteReadingDialog reading={bedtime36} failed onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't delete this reading. Check your connection and try again.");
  });

  it('T-M4-1: the buttons call confirm and cancel', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<DeleteReadingDialog reading={bedtime36} onConfirm={onConfirm} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: 'Delete reading' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
