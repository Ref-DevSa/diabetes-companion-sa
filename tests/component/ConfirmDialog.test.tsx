import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';

function Harness({ onCancel = vi.fn(), loading = false, error }: { onCancel?: () => void; loading?: boolean; error?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      {open ? (
        <ConfirmDialog
          title="Delete this reading?"
          text="26 Oct 2026, 21:30 · 3.6 mmol/L (Bedtime). This cannot be undone."
          confirmLabel="Delete reading"
          loadingLabel="Deleting…"
          cancelLabel="Cancel"
          loading={loading}
          error={error}
          onConfirm={vi.fn()}
          onCancel={() => {
            onCancel();
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

describe('T-C-16: Confirmation pop-up', () => {
  it('T-C-16: a centred modal up to 328 px wide with title and text', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete this reading?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveClass('max-w-dialog');
    expect(dialog).toHaveAccessibleDescription('26 Oct 2026, 21:30 · 3.6 mmol/L (Bedtime). This cannot be undone.');
  });

  it('T-C-16: focus is trapped inside and returns to the opener on close', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await user.click(opener);
    expect(screen.getByRole('button', { name: 'Delete reading' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Delete reading' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(opener).toHaveFocus();
  });

  it('T-C-16: Escape cancels', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<Harness onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('T-C-16: shows the loading label and an error', async () => {
    const user = userEvent.setup();
    render(<Harness loading error="Couldn't delete this reading. Check your connection and try again." />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't delete this reading. Check your connection and try again.");
  });

  it('T-C-16: Escape does nothing while it is working', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<Harness onCancel={onCancel} loading />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.keyboard('{Escape}');
    expect(onCancel).not.toHaveBeenCalled();
  });
});
