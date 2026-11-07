import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../src/App';
import { AccountLanguageSync } from '../../src/auth/AccountLanguageSync';
import * as authData from '../../src/data/auth';
import * as profileData from '../../src/data/profile';
import { i18n } from '../../src/i18n';
import { pickText } from '../../src/lib/pickText';
import { fakeSession, renderWithProviders } from '../helpers/render';

// T-US4-1 and T-US4-2 run with all three languages enabled (IMPLEMENTATION_PLAN.md Phase 3).
vi.mock('../../src/i18n/languages', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/i18n/languages')>();
  return { ...original, enabledLanguages: ['en', 'zu', 'tn'] };
});
vi.mock('../../src/data/auth', () => ({
  signUp: vi.fn(),
  resendConfirmation: vi.fn(),
  logIn: vi.fn(),
  requestPasswordReset: vi.fn(),
  saveNewPassword: vi.fn(),
  logOut: vi.fn(),
}));
vi.mock('../../src/data/profile', () => ({
  getProfile: vi.fn(),
  setLanguage: vi.fn(),
  deleteMyAccount: vi.fn(),
}));

const getProfile = vi.mocked(profileData.getProfile);
const setLanguage = vi.mocked(profileData.setLanguage);
const deleteMyAccount = vi.mocked(profileData.deleteMyAccount);
const logOut = vi.mocked(authData.logOut);
const thabo = { id: fakeSession.user.id, email: 'thabo.test@example.co.za', language: 'tn' as const };
const asUser = { auth: { session: fakeSession } };

function openProfile() {
  return renderWithProviders(<AppRoutes />, { route: '/profile', ...asUser });
}

describe('S11 Profile and settings', () => {
  beforeEach(() => {
    getProfile.mockReset().mockResolvedValue({ ok: true, data: thabo });
    setLanguage.mockReset().mockResolvedValue({ ok: true, data: undefined });
    deleteMyAccount.mockReset();
    logOut.mockReset().mockResolvedValue({ ok: true, data: undefined });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    i18n.removeResourceBundle('zu', 'translation');
    i18n.addResourceBundle('zu', 'translation', {});
  });

  it('T-S11-1: layout: title, email card, language list, Privacy Notice, Log out, Delete account', async () => {
    openProfile();
    expect(await screen.findByText('thabo.test@example.co.za')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'My profile' })).toBeInTheDocument();
    const languages = screen.getByRole('radiogroup', { name: 'Language' });
    expect(within(languages).getAllByRole('radio').map((r) => r.closest('label')?.textContent)).toEqual([
      'English',
      'isiZulu',
      'Setswana',
    ]);
    expect(screen.getByRole('button', { name: 'Privacy Notice' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toHaveClass('border-primary-dark');
    expect(screen.getByRole('button', { name: 'Delete account' })).toHaveClass('bg-error');
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
  });

  it('T-AUTH-8: the email is read-only; there is no way to change it', async () => {
    openProfile();
    const email = await screen.findByText('thabo.test@example.co.za');
    expect(email.tagName).not.toBe('INPUT');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /change email|edit email/i })).not.toBeInTheDocument();
  });

  it('T-S11-2: Loading shows grey placeholders for the card and the list', () => {
    getProfile.mockReturnValue(new Promise(() => undefined));
    openProfile();
    expect(screen.getByTestId('loading-placeholder')).toBeInTheDocument();
    expect(screen.queryByText('thabo.test@example.co.za')).not.toBeInTheDocument();
  });

  it('T-S11-2: Error shows "We couldn\'t load your profile. Please try again." and "Try again" reloads', async () => {
    getProfile.mockResolvedValueOnce({ ok: false, code: 'server' });
    openProfile();
    expect(await screen.findByText("We couldn't load your profile. Please try again.")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('thabo.test@example.co.za')).toBeInTheDocument();
    expect(getProfile).toHaveBeenCalledTimes(2);
  });

  it('T-US4-1: choosing isiZulu changes the screen text and saves it to the account', async () => {
    i18n.addResourceBundle('zu', 'translation', { profile: { title: 'ZU-TEST My profile' } }, true, true);
    const user = userEvent.setup();
    openProfile();
    await screen.findByText('thabo.test@example.co.za');
    await user.click(screen.getByRole('radio', { name: 'isiZulu' }));
    await waitFor(() => expect(i18n.language).toBe('zu'));
    expect(setLanguage).toHaveBeenCalledWith('zu');
    expect(screen.getByRole('heading', { name: 'ZU-TEST My profile' })).toBeInTheDocument();
    expect(screen.getByText('Language changed.')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'isiZulu' })).toBeChecked();
  });

  it('T-US4-1: the header language selector also saves a User\'s choice to the account', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/', ...asUser });
    await user.click(screen.getByRole('button', { name: /language/i }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Setswana' }));
    expect(setLanguage).toHaveBeenCalledWith('tn');
    await waitFor(() => expect(i18n.language).toBe('tn'));
  });

  it('T-US4-2: on log-in the app opens in the language saved to the account', async () => {
    renderWithProviders(<AccountLanguageSync />, asUser);
    await waitFor(() => expect(i18n.language).toBe('tn'));
    expect(getProfile).toHaveBeenCalled();
  });

  it('T-US4-3: missing isiZulu text shows the English text', async () => {
    await act(() => i18n.changeLanguage('zu'));
    openProfile();
    expect(await screen.findByRole('heading', { name: 'My profile' })).toBeInTheDocument();
    const topic = { title_en: 'What is diabetes?', title_zu: null, title_tn: null };
    expect(pickText(topic, 'title', 'zu')).toBe('What is diabetes?');
  });

  it('T-S11-3: Offline: saving a language shows "You\'re offline. Reconnect and try again." and saves nothing', async () => {
    const user = userEvent.setup();
    openProfile();
    await screen.findByText('thabo.test@example.co.za');
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    window.dispatchEvent(new Event('offline'));
    expect(await screen.findByText("You're offline. Some things may not work until you reconnect.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'isiZulu' }));
    expect(await screen.findByText("You're offline. Reconnect and try again.")).toBeInTheDocument();
    expect(setLanguage).not.toHaveBeenCalled();
    expect(i18n.language).toBe('en');
  });

  it('T-US5-1 / T-AUTH-7: "Log out" goes to S1 as a Visitor, with no confirmation', async () => {
    const user = userEvent.setup();
    openProfile();
    await screen.findByText('thabo.test@example.co.za');
    await user.click(screen.getByRole('button', { name: 'Log out' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(logOut).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
  });

  it('T-US5-2: "Delete account" then "Yes, delete everything" deletes and shows the message on S1', async () => {
    deleteMyAccount.mockResolvedValue({ ok: true, data: undefined });
    const user = userEvent.setup();
    openProfile();
    await screen.findByText('thabo.test@example.co.za');
    await user.click(screen.getByRole('button', { name: 'Delete account' }));
    await user.click(screen.getByRole('button', { name: 'Yes, delete everything' }));
    expect(deleteMyAccount).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Your account and data have been deleted.')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
  });

  it('T-US5-3: "Cancel" in M3 deletes nothing and stays on S11', async () => {
    const user = userEvent.setup();
    openProfile();
    await screen.findByText('thabo.test@example.co.za');
    await user.click(screen.getByRole('button', { name: 'Delete account' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(deleteMyAccount).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/profile');
  });

  it('T-US5-4: offline, "Yes, delete everything" shows the message and nothing is deleted', async () => {
    deleteMyAccount.mockResolvedValue({ ok: false, code: 'offline' });
    const user = userEvent.setup();
    openProfile();
    await screen.findByText('thabo.test@example.co.za');
    await user.click(screen.getByRole('button', { name: 'Delete account' }));
    await user.click(screen.getByRole('button', { name: 'Yes, delete everything' }));
    expect(await screen.findByText("Couldn't delete your account. Check your connection and try again.")).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/profile');
  });

  it('S11: "Privacy Notice" opens M2 and "Close" returns to S11', async () => {
    const user = userEvent.setup();
    openProfile();
    await screen.findByText('thabo.test@example.co.za');
    await user.click(screen.getByRole('button', { name: 'Privacy Notice' }));
    expect(screen.getByRole('dialog', { name: 'Privacy Notice' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/profile');
  });
});
