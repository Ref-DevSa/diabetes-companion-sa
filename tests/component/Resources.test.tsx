import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../src/App';
import * as content from '../../src/data/content';
import { ok } from '../../src/lib/errors';
import { fakeResources, fakeTips } from '../helpers/contentFixtures';
import { renderWithProviders } from '../helpers/render';

vi.mock('../../src/data/content', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/data/content')>();
  return { ...original, listResources: vi.fn(), listFamilyTips: vi.fn() };
});

const listResources = vi.mocked(content.listResources);
const listFamilyTips = vi.mocked(content.listFamilyTips);
const notice = 'Always follow the advice of your own doctor or clinic.';

function openHelp() {
  return renderWithProviders(<AppRoutes />, { route: '/help' });
}

function card(name: string) {
  return screen.getByRole('article', { name });
}

describe('S7 Resources and Family Support', () => {
  beforeEach(() => {
    listResources.mockReset().mockResolvedValue(ok(fakeResources));
    listFamilyTips.mockReset().mockResolvedValue(ok(fakeTips));
  });
  afterEach(() => vi.restoreAllMocks());

  it('T-S7-1: title, "Trusted organisations" with three Resource cards in order, then the tips and the notice', async () => {
    openHelp();
    expect(await screen.findByRole('article', { name: 'Diabetes South Africa' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Help and family support' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Trusted organisations' })).toBeInTheDocument();
    expect(screen.getAllByRole('article').map((a) => within(a).getByRole('heading').textContent)).toEqual([
      'Diabetes South Africa',
      'SEMDSA',
      'National Department of Health',
    ]);
    expect(within(card('SEMDSA')).getByText(fakeResources[1]!.description)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Tips for family and caregivers' })).toBeInTheDocument();
    expect(screen.getByText(notice)).toBeInTheDocument();
    // Everyone can open S7; no tab is active.
    expect(screen.getByTestId('location')).toHaveTextContent('/help');
    for (const tab of ['Home', 'Learn', 'Diary', 'Checklist', 'Dashboard']) {
      expect(screen.getByRole('link', { name: tab })).not.toHaveAttribute('aria-current');
    }
  });

  it('T-US14-1: "Open website" on "Diabetes South Africa" opens its website in a new tab', async () => {
    openHelp();
    const link = within(await screen.findByRole('article', { name: 'Diabetes South Africa' })).getByRole('link', { name: /Open website/ });
    expect(link).toHaveAttribute('href', 'https://www.diabetessa.org.za');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.getAttribute('rel')).toContain('noreferrer');
    expect(fireEvent.click(link)).toBe(true);
  });

  it('T-US14-2: five tips for family and caregivers, in order', async () => {
    openHelp();
    const heading = await screen.findByRole('heading', { name: 'Tips for family and caregivers' });
    const list = heading.parentElement?.querySelector('ul') as HTMLElement;
    expect(within(list).getAllByRole('listitem').map((li) => li.textContent)).toEqual(fakeTips.map((tip) => tip.text));
  });

  it('T-US14-3: offline, "Open website" does not open and says "You\'re offline. Reconnect to open this link."', async () => {
    openHelp();
    const link = within(await screen.findByRole('article', { name: 'SEMDSA' })).getByRole('link', { name: /Open website/ });
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    let opened = true;
    act(() => {
      opened = fireEvent.click(link);
    });
    expect(opened).toBe(false);
    expect(within(card('SEMDSA')).getByText("You're offline. Reconnect to open this link.")).toBeInTheDocument();
    expect(within(card('Diabetes South Africa')).queryByText(/Reconnect to open this link/)).not.toBeInTheDocument();
  });

  it('T-S7-2: Empty: "No resources yet. Please check back soon." and the notice still shows', async () => {
    listResources.mockResolvedValue(ok([]));
    listFamilyTips.mockResolvedValue(ok([]));
    openHelp();
    expect(await screen.findByText('No resources yet. Please check back soon.')).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.getByText(notice)).toBeInTheDocument();
  });

  it('T-S7-3: Loading: grey placeholders for the cards and the tips', () => {
    listResources.mockReturnValue(new Promise(() => undefined));
    openHelp();
    const region = screen.getByTestId('loading-placeholder');
    expect(region.querySelectorAll('[data-shape="card"]')).toHaveLength(3);
    expect(region.querySelectorAll('[data-shape="tip"]').length).toBeGreaterThanOrEqual(1);
  });

  it('T-S7-4: Error: "We couldn\'t load this page. Please try again." and "Try again" reloads', async () => {
    listFamilyTips.mockResolvedValueOnce({ ok: false, code: 'server' });
    openHelp();
    expect(await screen.findByText("We couldn't load this page. Please try again.")).toBeInTheDocument();
    expect(screen.getByText(notice)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('article', { name: 'Diabetes South Africa' })).toBeInTheDocument();
  });

  it('BR17: the content is loaded in the chosen language', async () => {
    openHelp();
    await screen.findByRole('article', { name: 'Diabetes South Africa' });
    expect(listResources).toHaveBeenCalledWith('en');
    expect(listFamilyTips).toHaveBeenCalledWith('en');
  });
});
