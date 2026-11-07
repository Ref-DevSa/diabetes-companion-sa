import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { AppRoutes } from '../../src/App';
import { fakeSession, renderWithProviders } from '../helpers/render';

vi.mock('../../src/data/profile', () => ({
  getProfile: vi.fn(() => new Promise(() => undefined)),
  setLanguage: vi.fn(),
  deleteMyAccount: vi.fn(),
}));

describe('T-BR16-1: route guards', () => {
  it.each(['/diary', '/checklist', '/dashboard', '/profile'])(
    'T-BR16-1: a Visitor opening %s is sent to S3 with "Log in to use this part of the app."',
    (path) => {
      renderWithProviders(<AppRoutes />, { route: path });
      const location = screen.getByTestId('location');
      expect(location).toHaveTextContent('/log-in');
      expect(JSON.parse(location.getAttribute('data-state') ?? 'null')).toMatchObject({ from: path });
      expect(screen.getByText('Log in to use this part of the app.')).toBeInTheDocument();
    },
  );

  it('T-BR16-1: a User can open the protected screens', () => {
    renderWithProviders(<AppRoutes />, { route: '/diary', auth: { session: fakeSession } });
    expect(screen.getByTestId('location')).toHaveTextContent('/diary');
  });

  it('T-BR16-1: while the session is still being checked, nobody is sent away', () => {
    renderWithProviders(<AppRoutes />, { route: '/diary', auth: { loading: true } });
    expect(screen.getByTestId('location')).toHaveTextContent('/diary');
  });

  it('T-BR16-1: a session the app ended sends the User to S3 with the ended-session banner', () => {
    renderWithProviders(<AppRoutes />, { route: '/checklist', auth: { sessionEnded: true } });
    expect(screen.getByTestId('location')).toHaveTextContent('/log-in');
    expect(screen.getByText('Your session has ended. Please log in again.')).toBeInTheDocument();
  });

  it('T-BR16-1: a password-reset (recovery) session does not open User screens', () => {
    renderWithProviders(<AppRoutes />, { route: '/diary', auth: { session: fakeSession, recovery: true } });
    expect(screen.getByTestId('location')).toHaveTextContent('/log-in');
  });
});
