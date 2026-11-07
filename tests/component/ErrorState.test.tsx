import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorState } from '../../src/components/ErrorState';

describe('T-C-14: Error state', () => {
  it('T-C-14: shows the message and a "Try again" button that calls retry', async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Something went wrong on our side. Please try again." onRetry={onRetry} />);
    expect(screen.getByText('Something went wrong on our side. Please try again.')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('T-C-14: sits on a white card and is announced', () => {
    render(<ErrorState message="We couldn't load the Topics. Please try again." onRetry={() => undefined} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-card');
    expect(alert).toHaveTextContent("We couldn't load the Topics. Please try again.");
  });
});
