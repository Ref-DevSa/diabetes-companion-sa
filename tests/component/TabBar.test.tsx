import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabBar } from '../../src/components/TabBar';
import { fakeSession, renderWithProviders } from '../helpers/render';

const tabs = ['Home', 'Learn', 'Diary', 'Checklist', 'Dashboard'];

describe('T-C-4: Tab bar', () => {
  it('T-C-4: five tabs, each with an icon and a label', () => {
    renderWithProviders(<TabBar />);
    const nav = screen.getByRole('navigation');
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(tabs);
    for (const link of links) {
      expect(link.querySelector('svg')).not.toBeNull();
      expect(link).toHaveClass('min-h-touch');
    }
  });

  it('T-C-4: the active tab is blue and marked as the current page', () => {
    renderWithProviders(<TabBar />, { route: '/learn' });
    const learn = screen.getByRole('link', { name: 'Learn' });
    expect(learn).toHaveAttribute('aria-current', 'page');
    expect(learn).toHaveClass('text-primary');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it.each([
    ['Diary', '/diary'],
    ['Checklist', '/checklist'],
    ['Dashboard', '/dashboard'],
  ])('T-C-4: a Visitor tapping %s goes to S3 and remembers the wanted screen', async (name, wanted) => {
    const user = userEvent.setup();
    renderWithProviders(<TabBar />);
    await user.click(screen.getByRole('link', { name }));
    const location = screen.getByTestId('location');
    expect(location).toHaveTextContent('/log-in');
    expect(JSON.parse(location.getAttribute('data-state') ?? 'null')).toEqual({ from: wanted });
  });

  it('T-C-4: a User tapping Diary goes to S8', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TabBar />, { auth: { session: fakeSession } });
    await user.click(screen.getByRole('link', { name: 'Diary' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/diary');
  });

  it('T-C-4: Learn and Home are open to Visitors', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TabBar />, { route: '/dashboard' });
    await user.click(screen.getByRole('link', { name: 'Learn' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/learn');
    await user.click(screen.getByRole('link', { name: 'Home' }));
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
  });

  it('T-C-4: is 56 px high and becomes a top menu from 640 px', () => {
    renderWithProviders(<TabBar />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('h-tab-bar', 'fixed', 'bottom-0', 'tablet:static');
  });
});
