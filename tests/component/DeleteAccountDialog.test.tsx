import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteAccountDialog } from '../../src/modals/DeleteAccountDialog';

describe('M3 Delete account confirmation', () => {
  it('T-M3-1: title, text and buttons exactly as PRD M3', () => {
    render(<DeleteAccountDialog onConfirm={vi.fn()} onCancel={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'Delete your account?' });
    expect(dialog).toHaveTextContent(
      'This will permanently delete your account, all your readings and your checklist. This cannot be undone.',
    );
    expect(screen.getByRole('button', { name: 'Yes, delete everything' })).toHaveClass('bg-error');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('border-primary-dark');
  });

  it('T-M3-1: Loading shows "Deleting…" on the disabled danger button', () => {
    render(<DeleteAccountDialog loading onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
  });

  it('T-M3-1: Error or offline shows the PRD message', () => {
    render(<DeleteAccountDialog failed onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't delete your account. Check your connection and try again.");
  });

  it('T-US5-2 / T-US5-3: the buttons call confirm and cancel', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<DeleteAccountDialog onConfirm={onConfirm} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: 'Yes, delete everything' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('T-M3-1: keyboard focus stays inside the pop-up', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Outside</button>
        <DeleteAccountDialog onConfirm={vi.fn()} onCancel={vi.fn()} />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Yes, delete everything' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Yes, delete everything' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Outside' })).not.toHaveFocus();
  });
});
