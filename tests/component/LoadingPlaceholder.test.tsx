import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { LoadingPlaceholder, PlaceholderBlock } from '../../src/components/LoadingPlaceholder';

describe('T-C-13: Loading placeholder', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('T-C-13: shows grey #E4E6EB blocks in a busy region', () => {
    render(
      <LoadingPlaceholder>
        <PlaceholderBlock className="h-24" />
        <PlaceholderBlock className="h-16" />
      </LoadingPlaceholder>,
    );
    const region = screen.getByTestId('loading-placeholder');
    expect(region).toHaveAttribute('aria-busy', 'true');
    const blocks = region.querySelectorAll('.bg-placeholder');
    expect(blocks).toHaveLength(2);
  });

  it('T-C-13: after 3 seconds the parent receives the timeout callback', () => {
    const onTimeout = vi.fn();
    render(
      <LoadingPlaceholder onTimeout={onTimeout}>
        <PlaceholderBlock />
      </LoadingPlaceholder>,
    );
    act(() => vi.advanceTimersByTime(2999));
    expect(onTimeout).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('T-C-13: no callback once the placeholder has gone', () => {
    const onTimeout = vi.fn();
    const { unmount } = render(
      <LoadingPlaceholder onTimeout={onTimeout}>
        <PlaceholderBlock />
      </LoadingPlaceholder>,
    );
    unmount();
    act(() => vi.advanceTimersByTime(5000));
    expect(onTimeout).not.toHaveBeenCalled();
  });
});
