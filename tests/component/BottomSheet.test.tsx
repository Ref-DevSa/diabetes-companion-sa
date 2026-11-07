import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomSheet } from '../../src/components/BottomSheet';

function Sheet({ onCancel = vi.fn() }: { onCancel?: () => void }) {
  return (
    <>
      <button type="button">Behind</button>
      <BottomSheet title="Add a reading" onCancel={onCancel}>
        <label>
          Reading (mmol/L)
          <input />
        </label>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </BottomSheet>
    </>
  );
}

describe('T-C-17: Bottom sheet', () => {
  it('T-C-17: a modal sheet at the bottom of a dimmed page, with its title', () => {
    render(<Sheet />);
    const sheet = screen.getByRole('dialog', { name: 'Add a reading' });
    expect(sheet).toHaveAttribute('aria-modal', 'true');
    expect(sheet.parentElement).toHaveClass('items-end', 'bg-text/60');
    expect(sheet).toHaveClass('rounded-t-card');
  });

  it('T-C-17: keyboard focus starts inside and stays inside', async () => {
    const user = userEvent.setup();
    render(<Sheet />);
    expect(screen.getByRole('textbox')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Behind' })).not.toHaveFocus();
  });

  it('T-C-17: Cancel and Escape close it', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<Sheet onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('T-C-17: it slides up, unless the phone asks for reduced motion', () => {
    render(<Sheet />);
    expect(screen.getByRole('dialog')).toHaveClass('motion-safe:animate-sheet-up');
  });
});
