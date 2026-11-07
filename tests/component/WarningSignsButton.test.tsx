import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WarningSignsButton } from '../../src/components/WarningSignsButton';
import { renderWithProviders } from '../helpers/render';

describe('T-C-3: Warning signs button', () => {
  it('T-C-3: red with white text, the triangle-alert icon and at least 44 px high', () => {
    renderWithProviders(<WarningSignsButton />);
    const link = screen.getByRole('link', { name: 'Warning signs' });
    expect(link).toHaveClass('bg-error', 'text-white', 'min-h-touch');
    expect(link.querySelector('svg.lucide-triangle-alert')).not.toBeNull();
  });

  it('T-C-3: opens S6 (/safety)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WarningSignsButton />, { route: '/learn' });
    await user.click(screen.getByRole('link', { name: 'Warning signs' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/safety');
  });
});
