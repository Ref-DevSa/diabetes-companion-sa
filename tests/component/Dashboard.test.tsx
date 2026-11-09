import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../src/App';
import * as dashboardData from '../../src/data/dashboard';
import type { DashboardData } from '../../src/data/dashboard';
import { ok } from '../../src/lib/errors';
import { fakeReadings, manyReadings } from '../helpers/readingFixtures';
import { fakeSession, renderWithProviders } from '../helpers/render';

vi.mock('../../src/data/dashboard', () => ({ getDashboard: vi.fn() }));

const getDashboard = vi.mocked(dashboardData.getDashboard);

function dashboard(readings = fakeReadings, done = 2, total = 5): DashboardData {
  return { readings, progress: { done, total, allDone: total > 0 && done === total } };
}

function openDashboard() {
  return renderWithProviders(<AppRoutes />, { route: '/dashboard', auth: { session: fakeSession } });
}

function readingsCard() {
  return screen.getByRole('region', { name: 'Last 7 readings' });
}

function checklistCard() {
  return screen.getByRole('region', { name: "Today's checklist" });
}

describe('S10 Dashboard', () => {
  beforeEach(() => {
    getDashboard.mockReset().mockResolvedValue(ok(dashboard()));
  });
  afterEach(() => vi.restoreAllMocks());

  it('T-S10-1: title "My Dashboard", both cards, and the Dashboard tab is active', async () => {
    openDashboard();
    expect(await screen.findByRole('region', { name: 'Last 7 readings' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'My Dashboard' })).toBeInTheDocument();
    expect(checklistCard()).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
  });

  it('T-US12-1: the 7 newest Readings with their badges and "3 of 4 done"', async () => {
    getDashboard.mockResolvedValue(ok(dashboard([...fakeReadings, ...manyReadings(2, Date.parse('2026-10-24T06:00:00Z'))], 3, 4)));
    openDashboard();
    const rows = within(await screen.findByRole('region', { name: 'Last 7 readings' })).getAllByRole('listitem');
    expect(rows).toHaveLength(7);
    expect(rows[0]).toHaveTextContent('6.8');
    expect(rows[0]).toHaveTextContent('Fasting');
    expect(rows[0]).toHaveTextContent('27 Oct');
    expect(within(checklistCard()).getByText('3 of 4 done')).toBeInTheDocument();
    expect(within(checklistCard()).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3');
  });

  it('T-S10-2: each row shows value, "When" label, short date and the Flag badge as in the Diary (D1)', async () => {
    openDashboard();
    const rows = within(await screen.findByRole('region', { name: 'Last 7 readings' })).getAllByRole('listitem');
    expect(rows[1]).toHaveTextContent('3.6');
    expect(rows[1]).toHaveTextContent('Bedtime');
    expect(rows[1]).toHaveTextContent('26 Oct');
    expect(within(rows[1]!).getByText('Low')).toBeInTheDocument();
    expect(within(rows[3]!).getByText('Very high')).toBeInTheDocument();
    expect(within(rows[0]!).queryByText(/Low|Very high/)).not.toBeInTheDocument();
    expect(readingsCard().textContent).not.toMatch(/in range|normal|target/i);
  });

  it('S10: "See all in my Diary" goes to S8 and "Go to Checklist" goes to S9', async () => {
    const user = userEvent.setup();
    openDashboard();
    await user.click(within(await screen.findByRole('region', { name: 'Last 7 readings' })).getByRole('link', { name: 'See all in my Diary' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/diary');
  });

  it('S10: "Go to Checklist" goes to S9', async () => {
    const user = userEvent.setup();
    openDashboard();
    await screen.findByRole('region', { name: 'Last 7 readings' });
    await user.click(within(checklistCard()).getByRole('link', { name: 'Go to Checklist' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/checklist');
  });

  it('T-US12-2: no Readings: "No readings yet. Add your first one in the Diary." with "Add a reading"; the checklist card still shows', async () => {
    getDashboard.mockResolvedValue(ok(dashboard([], 0, 4)));
    const user = userEvent.setup();
    openDashboard();
    expect(await screen.findByText('No readings yet. Add your first one in the Diary.')).toBeInTheDocument();
    expect(within(checklistCard()).getByText('0 of 4 done')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Add a reading' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/diary');
  });

  it('T-S10-3: Loading: grey placeholders for both cards', () => {
    getDashboard.mockReturnValue(new Promise(() => undefined));
    openDashboard();
    expect(screen.getByTestId('loading-placeholder').querySelectorAll('[data-shape="card"]')).toHaveLength(2);
  });

  it('T-US12-3: Error: "We couldn\'t load your Dashboard. Please try again." and "Try again" reloads', async () => {
    getDashboard.mockResolvedValueOnce({ ok: false, code: 'server' });
    openDashboard();
    expect(await screen.findByText("We couldn't load your Dashboard. Please try again.")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('region', { name: 'Last 7 readings' })).toBeInTheDocument();
  });

  it('T-S10-4: Offline: the last loaded data stays visible', async () => {
    openDashboard();
    await screen.findByRole('region', { name: 'Last 7 readings' });
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(within(readingsCard()).getAllByRole('listitem')).toHaveLength(5);
    expect(within(checklistCard()).getByText('2 of 5 done')).toBeInTheDocument();
    expect(getDashboard).toHaveBeenCalledTimes(1);
  });

  it('D2: no percentage and no invented subtitles', async () => {
    openDashboard();
    await screen.findByRole('region', { name: 'Last 7 readings' });
    expect(screen.getByRole('main').textContent).not.toContain('%');
    expect(screen.queryByText(/Keep up your daily care routine|Summary of your health/)).not.toBeInTheDocument();
  });
});
