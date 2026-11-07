import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { Header } from '../../src/components/Header';
import { fakeSession, renderWithProviders } from '../helpers/render';

describe('T-C-1: Header', () => {
  it('T-C-1: Visitor header shows the logo, language selector, "Warning signs" and "Log in"', () => {
    renderWithProviders(<Header />);
    const header = screen.getByRole('banner');
    expect(within(header).getByText('Diabetes Companion SA')).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: /language/i })).toBeInTheDocument();
    expect(within(header).getByRole('link', { name: 'Warning signs' })).toHaveAttribute('href', '/safety');
    expect(within(header).getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/log-in');
    expect(within(header).queryByRole('link', { name: 'My profile' })).not.toBeInTheDocument();
  });

  it('T-C-1: User header shows the profile icon instead of "Log in"', () => {
    renderWithProviders(<Header />, { auth: { session: fakeSession } });
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('link', { name: 'My profile' })).toHaveAttribute('href', '/profile');
    expect(within(header).queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
  });

  it.each(['/sign-up', '/log-in', '/forgot-password'])('T-C-1: "Log in" is hidden on %s', (route) => {
    renderWithProviders(<Header />, { route });
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Warning signs' })).toBeInTheDocument();
  });

  it('T-C-1: is 56 px high and stays at the top', () => {
    renderWithProviders(<Header />);
    expect(screen.getByRole('banner')).toHaveClass('h-header', 'sticky', 'top-0');
  });
});
