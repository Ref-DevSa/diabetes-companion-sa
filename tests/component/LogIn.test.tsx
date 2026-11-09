import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
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

const logIn = vi.mocked(authData.logIn);
const resend = vi.mocked(authData.resendConfirmation);

async function submit(email = 'thabo.test@example.co.za', password = 'abcdefg1') {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText('Email'), email);
  if (password) await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Log in' }));
  return user;
}

describe('S3 Log in', () => {
  beforeEach(() => {
    logIn.mockReset();
    resend.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it('S3 layout: title, fields, button and links; no tab bar; no header "Log in" button', () => {
    renderWithProviders(<AppRoutes />, { route: '/log-in' });
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password');
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/sign-up');
    expect(within(screen.getByRole('banner')).queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('T-US2-1: correct details go to S1', async () => {
    logIn.mockResolvedValue({ ok: true, data: undefined });
    renderWithProviders(<AppRoutes />, { route: '/log-in' });
    await submit();
    expect(logIn).toHaveBeenCalledWith('thabo.test@example.co.za', 'abcdefg1');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/));
  });

  it('T-US2-1: if the person has already left S3 when the log-in finishes, the app does not pull them back', async () => {
    let finish: (value: Awaited<ReturnType<typeof authData.logIn>>) => void = () => undefined;
    logIn.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderWithProviders(<AppRoutes />, { route: '/log-in' });
    const user = await submit();
    await user.click(within(screen.getByRole('banner')).getByRole('link', { name: /^Warning signs$/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/safety');
    await act(async () => finish({ ok: true, data: undefined }));
    expect(screen.getByTestId('location')).toHaveTextContent('/safety');
  });

  it('T-US2-1 / BR16: once logged in, S3 sends the User on to the screen they wanted', () => {
    renderWithProviders(<AppRoutes />, {
      route: { pathname: '/log-in', state: { from: '/checklist' } },
      auth: { session: fakeSession },
    });
    expect(screen.getByTestId('location')).toHaveTextContent('/checklist');
  });

  it('T-US2-2: a wrong password shows "Email or password is incorrect." and the email stays', async () => {
    logIn.mockResolvedValue({ ok: false, code: 'wrong_credentials' });
    renderWithProviders(<AppRoutes />, { route: '/log-in' });
    await submit();
    expect(await screen.findByText('Email or password is incorrect.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('thabo.test@example.co.za');
    expect(screen.getByTestId('location')).toHaveTextContent('/log-in');
  });

  it('T-US2-3: after 5 wrong tries the wait message shows and "Log in" is disabled', async () => {
    logIn.mockResolvedValue({ ok: false, code: 'too_many_tries' });
    renderWithProviders(<AppRoutes />, { route: '/log-in' });
    await submit();
    expect(await screen.findByText('Too many tries. Please wait 15 minutes and try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeDisabled();
  });

  it('T-US2-4: an unconfirmed email shows the message and "Send the email again", which sends it', async () => {
    logIn.mockResolvedValue({ ok: false, code: 'unconfirmed' });
    resend.mockResolvedValue({ ok: true, data: undefined });
    renderWithProviders(<AppRoutes />, { route: '/log-in' });
    const user = await submit();
    expect(await screen.findByText('Please confirm your email first. Check your inbox.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Send the email again' }));
    expect(resend).toHaveBeenCalledWith('thabo.test@example.co.za');
    expect(await screen.findByText("We've sent a new email.")).toBeInTheDocument();
  });

  it('S3: empty fields show "Enter a valid email address." and "Enter your password."', async () => {
    renderWithProviders(<AppRoutes />, { route: '/log-in' });
    await submit('', '');
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(logIn).not.toHaveBeenCalled();
  });

  it('T-S3-1: sent here by BR16, a banner says "Log in to use this part of the app."', () => {
    renderWithProviders(<AppRoutes />, { route: { pathname: '/log-in', state: { from: '/diary' } } });
    expect(screen.getByText('Log in to use this part of the app.')).toBeInTheDocument();
  });

  it('T-S3-2: after an ended session, a banner says "Your session has ended. Please log in again."', () => {
    renderWithProviders(<AppRoutes />, { route: { pathname: '/log-in', state: { reason: 'session_ended' } } });
    expect(screen.getByText('Your session has ended. Please log in again.')).toBeInTheDocument();
  });

  it('T-S3-2: the ended-session banner also shows when the app ended the session itself', () => {
    renderWithProviders(<AppRoutes />, { route: '/log-in', auth: { sessionEnded: true } });
    expect(screen.getByText('Your session has ended. Please log in again.')).toBeInTheDocument();
  });

  it('T-S3-3: Loading shows "Logging in…" on a disabled button', async () => {
    logIn.mockReturnValue(new Promise(() => undefined));
    renderWithProviders(<AppRoutes />, { route: '/log-in' });
    await submit();
    expect(screen.getByRole('button', { name: 'Logging in…' })).toBeDisabled();
  });

  it('T-S3-3: Offline shows the banner and a disabled button', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    renderWithProviders(<AppRoutes />, { route: '/log-in' });
    expect(screen.getByText("You're offline. Some things may not work until you reconnect.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeDisabled();
  });

  it('S3: a server problem shows the server message', async () => {
    logIn.mockResolvedValue({ ok: false, code: 'server' });
    renderWithProviders(<AppRoutes />, { route: '/log-in' });
    await submit();
    expect(await screen.findByText('Something went wrong on our side. Please try again.')).toBeInTheDocument();
  });
});
