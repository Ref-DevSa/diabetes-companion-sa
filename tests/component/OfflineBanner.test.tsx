import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { OfflineBanner } from '../../src/components/OfflineBanner';

const text = "You're offline. Some things may not work until you reconnect.";

function setOnline(value: boolean) {
  vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(value);
  window.dispatchEvent(new Event(value ? 'online' : 'offline'));
}

describe('T-C-12: Offline banner', () => {
  afterEach(() => vi.restoreAllMocks());

  it('T-C-12: hidden while online', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true);
    render(<OfflineBanner />);
    expect(screen.queryByText(text)).not.toBeInTheDocument();
  });

  it('T-C-12: shows when the browser goes offline and hides when it is back online', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true);
    render(<OfflineBanner />);

    act(() => setOnline(false));
    const banner = screen.getByText(text);
    expect(banner.closest('[role="status"]')).toHaveClass('bg-text', 'text-white');

    act(() => setOnline(true));
    expect(screen.queryByText(text)).not.toBeInTheDocument();
  });

  it('T-C-12: shows at once when the page opens offline', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    render(<OfflineBanner />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
