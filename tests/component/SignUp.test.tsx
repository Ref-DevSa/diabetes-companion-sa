import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../src/App';
import * as authData from '../../src/data/auth';
import { renderWithProviders } from '../helpers/render';

vi.mock('../../src/data/auth', () => ({
  signUp: vi.fn(),
  resendConfirmation: vi.fn(),
  logIn: vi.fn(),
  requestPasswordReset: vi.fn(),
  saveNewPassword: vi.fn(),
  logOut: vi.fn(),
}));

const signUp = vi.mocked(authData.signUp);

async function fillForm(options: { email?: string; password?: string; age?: boolean; privacy?: boolean } = {}) {
  const user = userEvent.setup();
  const { email = 'thabo.test@example.co.za', password = 'abcdefg1', age = true, privacy = true } = options;
  if (email) await user.type(screen.getByLabelText('Email'), email);
  if (password) await user.type(screen.getByLabelText('Password'), password);
  if (age) await user.click(screen.getByRole('checkbox', { name: 'I confirm I am 18 or older' }));
  if (privacy) await user.click(screen.getByRole('checkbox', { name: /I agree to the Privacy Notice/ }));
  return user;
}

describe('S2 Sign up', () => {
  beforeEach(() => {
    signUp.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it('T-US1-1: valid details and both boxes show "Check your email to confirm your account."', async () => {
    signUp.mockResolvedValue({ ok: true, data: undefined });
    renderWithProviders(<AppRoutes />, { route: '/sign-up' });
    const user = await fillForm();
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Check your email to confirm your account.')).toBeInTheDocument();
    expect(signUp).toHaveBeenCalledWith({ email: 'thabo.test@example.co.za', password: 'abcdefg1' });
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Go to log in' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/log-in');
  });

  it('T-US1-2 / T-BR18-1: the age box starts unticked and sign-up cannot proceed without it', async () => {
    renderWithProviders(<AppRoutes />, { route: '/sign-up' });
    const age = screen.getByRole('checkbox', { name: 'I confirm I am 18 or older' });
    expect(age).not.toBeChecked();
    const user = await fillForm({ age: false });
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    const message = screen.getByText('Please confirm you are 18 or older.');
    expect(age).toHaveAttribute('aria-describedby', message.id);
    expect(signUp).not.toHaveBeenCalled();
  });

  it('T-US1-2: the privacy box is required too', async () => {
    renderWithProviders(<AppRoutes />, { route: '/sign-up' });
    const user = await fillForm({ privacy: false });
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByText('Please agree to the Privacy Notice to continue.')).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('T-US1-3: an already registered email shows the message under the email field', async () => {
    signUp.mockResolvedValue({ ok: false, code: 'email_taken' });
    renderWithProviders(<AppRoutes />, { route: '/sign-up' });
    const user = await fillForm();
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    const message = await screen.findByText('This email is already registered. Try logging in.');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-describedby', message.id);
    expect(screen.getByLabelText('Email')).toHaveValue('thabo.test@example.co.za');
  });

  it('T-US1-4: the password "abc" shows the rule and the typed text stays', async () => {
    renderWithProviders(<AppRoutes />, { route: '/sign-up' });
    const user = await fillForm({ password: 'abc' });
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByText('Password must be at least 8 characters and include a number.')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveValue('abc');
    expect(signUp).not.toHaveBeenCalled();
  });

  it('T-US1-4: an invalid email shows "Enter a valid email address."', async () => {
    renderWithProviders(<AppRoutes />, { route: '/sign-up' });
    const user = await fillForm({ email: 'thabo.test' });
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('T-AUTH-1: only email and password sign-up exists (no social or phone options)', () => {
    renderWithProviders(<AppRoutes />, { route: '/sign-up' });
    const main = screen.getByRole('main');
    expect(within(main).getAllByRole('textbox')).toHaveLength(1);
    expect(within(main).queryByText(/google|facebook|apple|phone|sms|microsoft/i)).not.toBeInTheDocument();
    expect(within(main).getAllByRole('button').map((b) => b.textContent)).toEqual(
      expect.not.arrayContaining([expect.stringMatching(/continue with/i)]),
    );
  });

  it('S2 layout: title, fields, boxes, button and the log-in link; no tab bar; no "Log in" button in the header', () => {
    renderWithProviders(<AppRoutes />, { route: '/sign-up' });
    expect(screen.getByRole('heading', { name: 'Create your free account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('placeholder', 'you@example.co.za');
    expect(screen.getByLabelText('Password')).toHaveAttribute('placeholder', 'At least 8 characters and 1 number');
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/log-in');
    expect(within(screen.getByRole('banner')).queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('S2: the "Privacy Notice" link opens M2 without ticking the box', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/sign-up' });
    await user.click(screen.getByRole('button', { name: 'Privacy Notice' }));
    expect(screen.getByRole('dialog', { name: 'Privacy Notice' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /I agree to the Privacy Notice/ })).not.toBeChecked();
  });

  it('T-S2-1: Loading: the button shows "Creating your account…" and is disabled', async () => {
    signUp.mockReturnValue(new Promise(() => undefined));
    renderWithProviders(<AppRoutes />, { route: '/sign-up' });
    const user = await fillForm();
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByRole('button', { name: 'Creating your account…' })).toBeDisabled();
  });

  it('T-S2-2: Offline: the banner shows and the button is disabled', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    renderWithProviders(<AppRoutes />, { route: '/sign-up' });
    expect(screen.getByText("You're offline. Some things may not work until you reconnect.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled();
  });

  it('T-S2-3: Error: a server problem shows the server message and keeps the typed text', async () => {
    signUp.mockResolvedValue({ ok: false, code: 'server' });
    renderWithProviders(<AppRoutes />, { route: '/sign-up' });
    const user = await fillForm();
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Something went wrong on our side. Please try again.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('thabo.test@example.co.za');
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled();
  });

  it('T-S2-4: Success: the form is replaced by a card with "Go to log in"', async () => {
    signUp.mockResolvedValue({ ok: true, data: undefined });
    renderWithProviders(<AppRoutes />, { route: '/sign-up' });
    const user = await fillForm();
    await act(() => user.click(screen.getByRole('button', { name: 'Create account' })));
    expect(screen.queryByRole('button', { name: 'Create account' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to log in' })).toHaveAttribute('href', '/log-in');
  });
});
