import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../src/App';
import { fakeSession, renderWithProviders } from '../helpers/render';

const notice = 'This app gives general information only. It does not diagnose or replace your clinic.';
const cards = [
  ['Learn about diabetes', 'Short, plain-language Topics'],
  ['Check warning signs', 'Know when to get urgent help'],
  ['Help for family', 'Tips and trusted links'],
  ['Track my day', 'Diary and Checklist'],
];

describe('S1 Home', () => {
  afterEach(() => vi.restoreAllMocks());

  it('T-S1-1: Visitor sees the hero, both buttons, four feature cards and the notice', () => {
    renderWithProviders(<AppRoutes />, { route: '/' });
    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { name: 'Understand diabetes. Track your day.' })).toBeInTheDocument();
    expect(within(main).getByText('Short, simple help for people living with diabetes in South Africa.')).toBeInTheDocument();
    expect(within(main).getByRole('link', { name: 'Create free account' })).toHaveAttribute('href', '/sign-up');
    expect(within(main).getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/log-in');
    expect(within(main).queryByText('Welcome back!')).not.toBeInTheDocument();
    expect(within(main).getByRole('heading', { name: 'What would you like to do?' })).toBeInTheDocument();
    for (const [title, line] of cards) {
      const card = within(main).getByRole('link', { name: new RegExp(title as string) });
      expect(card).toHaveTextContent(line as string);
    }
    expect(within(main).getByText(notice)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  });

  it('T-S1-1: the order is hero, buttons, heading, cards, notice', () => {
    renderWithProviders(<AppRoutes />, { route: '/' });
    const text = screen.getByRole('main').textContent ?? '';
    const order = [
      'Understand diabetes. Track your day.',
      'Create free account',
      'What would you like to do?',
      'Learn about diabetes',
      'Check warning signs',
      'Help for family',
      'Track my day',
      notice,
    ].map((part) => text.indexOf(part));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it.each([
    ['Learn about diabetes', '/learn'],
    ['Check warning signs', '/safety'],
    ['Help for family', '/help'],
    ['Track my day', '/log-in'],
  ])('T-S1-1: the Visitor card "%s" goes to %s', async (title, path) => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/' });
    await user.click(screen.getByRole('link', { name: new RegExp(title) }));
    expect(screen.getByTestId('location')).toHaveTextContent(path);
  });

  it('T-S1-2: User sees "Welcome back!" and "Add a reading" instead of the two Visitor buttons', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/', auth: { session: fakeSession } });
    const main = screen.getByRole('main');
    expect(within(main).getByText('Welcome back!')).toBeInTheDocument();
    expect(within(main).queryByRole('link', { name: 'Create free account' })).not.toBeInTheDocument();
    expect(within(main).queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My profile' })).toBeInTheDocument();
    await user.click(within(main).getByRole('link', { name: 'Add a reading' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/diary');
  });

  it('T-S1-2: the User card "Track my day" goes to S8', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/', auth: { session: fakeSession } });
    await user.click(screen.getByRole('link', { name: /Track my day/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/diary');
  });

  it('T-S1-3: Loading shows grey placeholders for the hero and the four cards', () => {
    renderWithProviders(<AppRoutes />, { route: '/', auth: { loading: true } });
    const region = screen.getByTestId('loading-placeholder');
    expect(region.querySelectorAll('[data-shape="hero"]')).toHaveLength(1);
    expect(region.querySelectorAll('[data-shape="card"]')).toHaveLength(4);
    expect(screen.queryByText('Understand diabetes. Track your day.')).not.toBeInTheDocument();
  });

  it('T-S1-3: Loading longer than 3 seconds shows the error state', () => {
    vi.useFakeTimers();
    try {
      renderWithProviders(<AppRoutes />, { route: '/', auth: { loading: true } });
      act(() => vi.advanceTimersByTime(3000));
      expect(screen.getByText('Something went wrong on our side. Please try again.')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('T-S1-4: Error shows the message with "Try again", which retries', async () => {
    const retry = vi.fn();
    renderWithProviders(<AppRoutes />, { route: '/', auth: { error: true, retry } });
    expect(screen.getByText('Something went wrong on our side. Please try again.')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('T-S1-5: Offline shows the offline banner under the header, and Home still shows', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    renderWithProviders(<AppRoutes />, { route: '/' });
    const banner = screen.getByText("You're offline. Some things may not work until you reconnect.");
    const header = screen.getByRole('banner');
    expect(header.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Understand diabetes. Track your day.' })).toBeInTheDocument();
  });

  it('T-S1-5: an unknown address shows S1', () => {
    renderWithProviders(<AppRoutes />, { route: '/no-such-page' });
    expect(screen.getByRole('heading', { name: 'Understand diabetes. Track your day.' })).toBeInTheDocument();
  });
});
