import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotebookPen } from 'lucide-react';
import { EmptyState } from '../../src/components/EmptyState';

describe('T-C-15: Empty-state block', () => {
  it('T-C-15: shows an icon and the message, with no button when none is given', () => {
    render(<EmptyState icon={NotebookPen} message="No topics yet. Please check back soon." />);
    expect(screen.getByText('No topics yet. Please check back soon.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(document.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('T-C-15: shows the optional button and calls it', async () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        icon={NotebookPen}
        message="No readings yet. Add your first one in the Diary."
        action={{ label: 'Add a reading', onClick }}
      />,
    );
    await userEvent.setup().click(screen.getByRole('button', { name: 'Add a reading' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
