// PRD 6.2 edge cases 1 and 2, checked on every form that saves something.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../src/App';
import * as authData from '../../src/data/auth';
import * as checklistData from '../../src/data/checklist';
import * as readingsData from '../../src/data/readings';
import { ok } from '../../src/lib/errors';
import { CustomItemSheet } from '../../src/modals/CustomItemSheet';
import { ReadingSheet } from '../../src/modals/ReadingSheet';
import { checklist, standardItems } from '../helpers/checklistFixtures';
import { fakeReadings } from '../helpers/readingFixtures';
import { fakeSession, renderWithProviders } from '../helpers/render';

vi.mock('../../src/data/auth', () => ({
  signUp: vi.fn(),
  resendConfirmation: vi.fn(),
  logIn: vi.fn(),
  requestPasswordReset: vi.fn(),
  saveNewPassword: vi.fn(),
  logOut: vi.fn(),
}));
vi.mock('../../src/data/readings', () => ({ listReadings: vi.fn(), addReading: vi.fn(), updateReading: vi.fn(), deleteReading: vi.fn() }));
vi.mock('../../src/data/checklist', () => ({
  getTodayChecklist: vi.fn(),
  tickItem: vi.fn(),
  untickItem: vi.fn(),
  addCustomItem: vi.fn(),
  renameCustomItem: vi.fn(),
  deleteCustomItem: vi.fn(),
}));

const offlineText = "You're offline. Reconnect and try again.";
const serverText = 'Something went wrong on our side. Please try again.';

function goOffline() {
  vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
  act(() => {
    window.dispatchEvent(new Event('offline'));
  });
}

function goOnline() {
  vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true);
  act(() => {
    window.dispatchEvent(new Event('online'));
  });
}

beforeEach(() => {
  vi.mocked(readingsData.addReading).mockReset();
  vi.mocked(checklistData.addCustomItem).mockReset();
  vi.mocked(authData.signUp).mockReset();
  vi.mocked(authData.logIn).mockReset();
  vi.mocked(authData.requestPasswordReset).mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe('T-EDGE-1: no internet while saving anything', () => {
  it('T-EDGE-1: M1: the offline message shows, "Save" is disabled and the typed Reading stays', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReadingSheet onClose={vi.fn()} onSaved={vi.fn()} onGone={vi.fn()} />);
    await user.type(screen.getByLabelText('Reading (mmol/L)'), '6.8');
    goOffline();
    expect(screen.getByText(offlineText)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByLabelText('Reading (mmol/L)')).toHaveValue('6.8');
    goOnline();
    expect(screen.queryByText(offlineText)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('T-EDGE-1: M5: the offline message shows, "Save" is disabled and the typed name stays', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomItemSheet existingNames={[]} onClose={vi.fn()} onSaved={vi.fn()} />);
    await user.type(screen.getByLabelText('Item name'), 'Evening walk');
    goOffline();
    expect(screen.getByText(offlineText)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByLabelText('Item name')).toHaveValue('Evening walk');
  });

  it.each([
    ['/sign-up', 'Create account'],
    ['/log-in', 'Log in'],
    ['/forgot-password', 'Send reset link'],
  ])('T-EDGE-1: %s: the offline message shows, "%s" is disabled and the typed email stays', async (route, button) => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route });
    await user.type(screen.getByLabelText('Email'), 'thabo.test@example.co.za');
    goOffline();
    expect(screen.getByText(offlineText)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: button })).toBeDisabled();
    expect(screen.getByLabelText('Email')).toHaveValue('thabo.test@example.co.za');
  });
});

describe('T-EDGE-2: server or unknown error', () => {
  it('T-EDGE-2: M1: the server message with "Try again", which saves again; nothing is reported saved until then', async () => {
    const addReading = vi.mocked(readingsData.addReading);
    addReading.mockResolvedValueOnce({ ok: false, code: 'server' }).mockResolvedValueOnce(ok(fakeReadings[0]!));
    const onSaved = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ReadingSheet onClose={vi.fn()} onSaved={onSaved} onGone={vi.fn()} />);
    await user.type(screen.getByLabelText('Reading (mmol/L)'), '6.8');
    await user.selectOptions(screen.getByLabelText('When'), 'fasting');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(serverText)).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Reading (mmol/L)')).toHaveValue('6.8');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(addReading).toHaveBeenCalledTimes(2);
  });

  it('T-EDGE-2: M5: the server message with "Try again", which saves again', async () => {
    const addCustomItem = vi.mocked(checklistData.addCustomItem);
    addCustomItem.mockResolvedValueOnce({ ok: false, code: 'server' }).mockResolvedValueOnce(ok({ id: 'c1', isStandard: false, standardKey: null, name: 'Evening walk' }));
    const onSaved = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<CustomItemSheet existingNames={[]} onClose={vi.fn()} onSaved={onSaved} />);
    await user.type(screen.getByLabelText('Item name'), 'Evening walk');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(serverText)).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  });

  it('T-EDGE-2: S2: the server message with "Try again", which sends the sign-up again', async () => {
    const signUp = vi.mocked(authData.signUp);
    signUp.mockResolvedValueOnce({ ok: false, code: 'server' }).mockResolvedValueOnce(ok(undefined));
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/sign-up' });
    await user.type(screen.getByLabelText('Email'), 'new.person@example.co.za');
    await user.type(screen.getByLabelText('Password', { selector: 'input' }), 'abcdefg1');
    await user.click(screen.getByLabelText('I confirm I am 18 or older'));
    await user.click(screen.getByRole('checkbox', { name: /I agree to the/ }));
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText(serverText)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Check your email to confirm your account.')).toBeInTheDocument();
    expect(signUp).toHaveBeenCalledTimes(2);
  });

  it('T-EDGE-2: S9: a tick that fails shows the server message with "Try again", which ticks again', async () => {
    vi.mocked(checklistData.getTodayChecklist).mockResolvedValue(ok(checklist(standardItems)));
    const tickItem = vi.mocked(checklistData.tickItem);
    tickItem.mockReset().mockResolvedValueOnce({ ok: false, code: 'server' }).mockResolvedValueOnce(ok(undefined));
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/checklist', auth: { session: fakeSession } });
    await user.click(await screen.findByRole('checkbox', { name: 'Drink water' }));
    expect(await screen.findByText(serverText)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Drink water' })).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Drink water' })).toBeChecked());
    expect(tickItem).toHaveBeenCalledTimes(2);
  });
});
