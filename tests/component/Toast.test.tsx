import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { Toast } from '../../src/components/Toast';

describe('T-C-11: Toast', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('T-C-11: shows for 3 seconds, then disappears and reports it is done', () => {
    const onDone = vi.fn();
    render(<Toast message="Language changed." onDone={onDone} />);
    expect(screen.getByRole('status')).toHaveTextContent('Language changed.');

    act(() => vi.advanceTimersByTime(2999));
    expect(screen.getByText('Language changed.')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText('Language changed.')).not.toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('T-C-11: a success toast has a green tick', () => {
    render(<Toast message="High five! Reading saved." variant="success" />);
    const tick = screen.getByRole('status').querySelector('svg.lucide-circle-check');
    expect(tick).not.toBeNull();
    expect(tick).toHaveClass('text-success');
  });

  it('T-C-11: a neutral toast has no tick; white text on #1C1E21, above the tab bar', () => {
    render(<Toast message="We've sent a new email." />);
    const toast = screen.getByRole('status');
    expect(toast.querySelector('svg.lucide-circle-check')).toBeNull();
    expect(toast.firstElementChild).toHaveClass('bg-text', 'text-white');
    expect(toast).toHaveClass('bottom-tab-bar');
  });
});
