import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../src/App';
import { fakeSession, renderWithProviders } from '../helpers/render';

vi.mock('../../src/data/content', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/data/content')>();
  const pending = () => new Promise<never>(() => undefined);
  return { ...original, listTopics: vi.fn(pending), listSafetyItems: vi.fn(pending), listResources: vi.fn(pending), listFamilyTips: vi.fn(pending) };
});

vi.mock('../../src/data/profile', () => ({
  getProfile: vi.fn(() => new Promise(() => undefined)),
  setLanguage: vi.fn(),
  deleteMyAccount: vi.fn(),
}));

describe('Navigation rules (Section 11)', () => {
  it.each(['/', '/sign-up', '/log-in', '/forgot-password', '/learn', '/safety', '/help'])(
    'T-NAV-1: a Visitor can open %s',
    (path) => {
      renderWithProviders(<AppRoutes />, { route: path });
      expect(screen.getByTestId('location')).toHaveTextContent(new RegExp(`^${path}$`));
    },
  );

  it('T-NAV-1: a Visitor can open M2 (from S2)', async () => {
    renderWithProviders(<AppRoutes />, { route: '/sign-up' });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Privacy Notice' }));
    expect(screen.getByRole('dialog', { name: 'Privacy Notice' })).toBeInTheDocument();
  });

  it.each(['/diary', '/checklist', '/dashboard', '/profile'])('T-NAV-2: a Visitor on %s goes to S3', (path) => {
    renderWithProviders(<AppRoutes />, { route: path });
    expect(screen.getByTestId('location')).toHaveTextContent('/log-in');
  });

  it.each(['/sign-up', '/log-in', '/forgot-password'])('T-NAV-3: a User opening %s goes to S1', (path) => {
    renderWithProviders(<AppRoutes />, { route: path, auth: { session: fakeSession } });
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
    expect(screen.getByText('Welcome back!')).toBeInTheDocument();
  });

  it('T-NAV-3: the reset-password step (recovery session) stays on S4', () => {
    renderWithProviders(<AppRoutes />, { route: '/forgot-password', auth: { session: fakeSession, recovery: true } });
    expect(screen.getByTestId('location')).toHaveTextContent('/forgot-password');
    expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeInTheDocument();
  });

  it.each(['/no-such-page', '/diary/extra/parts'])('T-NAV-4: an unknown address %s shows S1', (path) => {
    renderWithProviders(<AppRoutes />, { route: path });
    expect(screen.getByRole('heading', { name: 'Understand diabetes. Track your day.' })).toBeInTheDocument();
  });

  it('S11: the profile icon opens S11 for a User', async () => {
    renderWithProviders(<AppRoutes />, { route: '/', auth: { session: fakeSession } });
    await userEvent.setup().click(screen.getByRole('link', { name: 'My profile' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/profile');
  });

  it('T-NAV-9: /help is S7 itself, not the development-only placeholder', () => {
    renderWithProviders(<AppRoutes />, { route: '/help' });
    expect(screen.getByRole('heading', { level: 1, name: 'Help and family support' })).toBeInTheDocument();
    expect(screen.queryByTestId('dev-placeholder')).not.toBeInTheDocument();
  });

  it.each([
    ['/safety', 'Find help and trusted links'],
    ['/learn', 'Help for family and caregivers'],
    ['/', 'Help for family'],
  ])('T-NAV-9: on %s, the link "%s" opens S7', async (path, name) => {
    renderWithProviders(<AppRoutes />, { route: path });
    await userEvent.setup().click(screen.getByRole('link', { name: new RegExp(name) }));
    expect(screen.getByTestId('location')).toHaveTextContent('/help');
    expect(screen.getByRole('heading', { level: 1, name: 'Help and family support' })).toBeInTheDocument();
  });
});
