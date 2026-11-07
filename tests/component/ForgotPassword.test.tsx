import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../src/App';
import * as authData from '../../src/data/auth';
import { fakeSession, renderWithProviders } from '../helpers/render';

vi.mock('../../src/data/auth', () => ({
  signUp: vi.fn(),
  resendConfirmation: vi.fn(),
  logIn: vi.fn(),
  requestPasswordReset: vi.fn(),
  saveNewPassword: vi.fn(),
  logOut: vi.fn(),
}));

const requestReset = vi.mocked(authData.requestPasswordReset);
const saveNewPassword = vi.mocked(authData.saveNewPassword);
const recoveryAuth = { session: fakeSession, recovery: true };

async function fillNewPassword(first: string, second: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('New password'), first);
  await user.type(screen.getByLabelText('Confirm new password'), second);
  await user.click(screen.getByRole('button', { name: 'Save new password' }));
  return user;
}

describe('S4 Forgot password', () => {
  beforeEach(() => {
    requestReset.mockReset();
    saveNewPassword.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it('S4 step 1 layout: title, text, email, button and "Back to log in"', () => {
    renderWithProviders(<AppRoutes />, { route: '/forgot-password' });
    expect(screen.getByRole('heading', { name: 'Forgot your password?' })).toBeInTheDocument();
    expect(screen.getByText("Enter your email and we'll send you a link to choose a new one.")).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to log in' })).toHaveAttribute('href', '/log-in');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('T-US3-1: a registered email shows the neutral message', async () => {
    requestReset.mockResolvedValue({ ok: true, data: undefined });
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/forgot-password' });
    await user.type(screen.getByLabelText('Email'), 'nomsa.test@example.co.za');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText("If this email is registered, we've sent a reset link.")).toBeInTheDocument();
    expect(requestReset).toHaveBeenCalledWith('nomsa.test@example.co.za');
  });

  it('S4 step 1: an invalid email shows "Enter a valid email address."', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/forgot-password' });
    await user.type(screen.getByLabelText('Email'), 'nomsa');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(requestReset).not.toHaveBeenCalled();
  });

  it('T-S4-1: step 2 layout after the email link', () => {
    renderWithProviders(<AppRoutes />, { route: '/forgot-password', auth: recoveryAuth });
    expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Confirm new password')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Save new password' })).toBeInTheDocument();
  });

  it('T-US3-2: the same new password twice shows "Password changed. Please log in." on S3', async () => {
    saveNewPassword.mockResolvedValue({ ok: true, data: undefined });
    renderWithProviders(<AppRoutes />, { route: '/forgot-password', auth: recoveryAuth });
    await fillNewPassword('newpass12', 'newpass12');
    expect(saveNewPassword).toHaveBeenCalledWith('newpass12');
    expect(await screen.findByText('Password changed. Please log in.')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/log-in');
  });

  it('T-US3-4: different passwords show "Passwords don\'t match." under the second field', async () => {
    renderWithProviders(<AppRoutes />, { route: '/forgot-password', auth: recoveryAuth });
    await fillNewPassword('newpass12', 'newpass13');
    const message = screen.getByText("Passwords don't match.");
    expect(screen.getByLabelText('Confirm new password')).toHaveAttribute('aria-describedby', message.id);
    expect(saveNewPassword).not.toHaveBeenCalled();
  });

  it('S4 step 2: a weak new password shows the password rule', async () => {
    renderWithProviders(<AppRoutes />, { route: '/forgot-password', auth: recoveryAuth });
    await fillNewPassword('short', 'short');
    expect(screen.getByText('Password must be at least 8 characters and include a number.')).toBeInTheDocument();
    expect(saveNewPassword).not.toHaveBeenCalled();
  });

  it('T-US3-3 / T-S4-2: an expired link shows the message and "Send a new link", which returns to step 1', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/forgot-password', auth: { linkExpired: true } });
    expect(screen.getByText('This link has expired. Ask for a new one.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Send a new link' }));
    expect(screen.getByRole('heading', { name: 'Forgot your password?' })).toBeInTheDocument();
  });

  it('T-US3-3: saving with a link that expired meanwhile shows the expired message', async () => {
    saveNewPassword.mockResolvedValue({ ok: false, code: 'link_expired' });
    renderWithProviders(<AppRoutes />, { route: '/forgot-password', auth: recoveryAuth });
    await fillNewPassword('newpass12', 'newpass12');
    expect(await screen.findByText('This link has expired. Ask for a new one.')).toBeInTheDocument();
  });

  it('T-S4-3: Loading shows "Sending…" and "Saving…" on disabled buttons', async () => {
    requestReset.mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<AppRoutes />, { route: '/forgot-password' });
    await user.type(screen.getByLabelText('Email'), 'nomsa.test@example.co.za');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
    unmount();

    saveNewPassword.mockReturnValue(new Promise(() => undefined));
    renderWithProviders(<AppRoutes />, { route: '/forgot-password', auth: recoveryAuth });
    await fillNewPassword('newpass12', 'newpass12');
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  });

  it('T-S4-3: Offline shows the banner and disabled buttons', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    renderWithProviders(<AppRoutes />, { route: '/forgot-password' });
    expect(screen.getByText("You're offline. Some things may not work until you reconnect.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeDisabled();
  });

  it('S4: a server problem shows the server message', async () => {
    requestReset.mockResolvedValue({ ok: false, code: 'server' });
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/forgot-password' });
    await user.type(screen.getByLabelText('Email'), 'nomsa.test@example.co.za');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText('Something went wrong on our side. Please try again.')).toBeInTheDocument();
  });
});
