import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../src/App';
import * as content from '../../src/data/content';
import { ok } from '../../src/lib/errors';
import { fakeSafetyItems } from '../helpers/contentFixtures';
import { renderWithProviders } from '../helpers/render';

vi.mock('../../src/data/content', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/data/content')>();
  return { ...original, listTopics: vi.fn(), listSafetyItems: vi.fn() };
});

const listSafetyItems = vi.mocked(content.listSafetyItems);
const emergencyText = 'Call 112 from a cell phone or 10177 for an ambulance, or go to the nearest hospital. Do not wait for this app.';
const disclaimer = 'This app gives general information only. It does not diagnose or replace your clinic.';

function openSafety() {
  return renderWithProviders(<AppRoutes />, { route: '/safety' });
}

function emergencyBox() {
  return screen.getByRole('region', { name: 'In an emergency, get help now' });
}

describe('S6 Safety Guide', () => {
  beforeEach(() => {
    listSafetyItems.mockReset().mockResolvedValue(ok(fakeSafetyItems));
    vi.mocked(content.listTopics).mockResolvedValue(ok([]));
  });
  afterEach(() => vi.restoreAllMocks());

  it.each(['/', '/learn', '/help', '/sign-up'])('T-US13-1: the red "Warning signs" button on %s opens S6 with the emergency box at the top', async (route) => {
    renderWithProviders(<AppRoutes />, { route });
    await userEvent.setup().click(screen.getByRole('link', { name: 'Warning signs' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/safety');
    const main = screen.getByRole('main');
    expect(main.firstElementChild?.firstElementChild).toBe(emergencyBox());
  });

  it('T-US13-2: the emergency box shows the call-for-help text, on a white card with a red border', () => {
    openSafety();
    const box = emergencyBox();
    expect(box).toHaveTextContent(emergencyText);
    expect(box).toHaveClass('bg-card', 'border-error');
    expect(box.querySelector('svg.lucide-triangle-alert')).not.toBeNull();
  });

  it('T-US13-4: shows "Symptoms alone cannot confirm diabetes. Only a test at a clinic can."', () => {
    openSafety();
    expect(screen.getByText('Symptoms alone cannot confirm diabetes. Only a test at a clinic can.')).toBeInTheDocument();
  });

  it('T-S6-1: layout order: emergency box, note, the three lists, the button, the notice and review date', async () => {
    openSafety();
    await screen.findByText('Shaking or feeling jittery');
    const text = screen.getByRole('main').textContent ?? '';
    const order = [
      'In an emergency, get help now',
      'Symptoms alone cannot confirm diabetes.',
      'Signs of low blood sugar',
      'Signs of high blood sugar',
      'Get urgent medical help if…',
      'Find help and trusted links',
      disclaimer,
      'Content last reviewed:',
    ].map((part) => text.indexOf(part));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('T-S6-2: the three lists show their items in order', async () => {
    openSafety();
    await screen.findByText('Shaking or feeling jittery');
    for (const [heading, section] of [
      ['Signs of low blood sugar', 'low'],
      ['Signs of high blood sugar', 'high'],
      ['Get urgent medical help if…', 'urgent'],
    ] as const) {
      const list = screen.getByRole('list', { name: heading });
      expect(within(list).getAllByRole('listitem').map((li) => li.textContent)).toEqual(
        fakeSafetyItems.filter((item) => item.section === section).map((item) => item.text),
      );
    }
  });

  it('T-S6-1: "Find help and trusted links" goes to S7', async () => {
    openSafety();
    await screen.findByText('Shaking or feeling jittery');
    await userEvent.setup().click(screen.getByRole('link', { name: 'Find help and trusted links' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/help');
  });

  it('T-S6-5 / T-BR22-3: the disclaimer and "Content last reviewed:" with the latest review date', async () => {
    openSafety();
    expect(await screen.findByText('Content last reviewed: 03 Nov 2026')).toBeInTheDocument();
    expect(screen.getByText(disclaimer)).toBeInTheDocument();
  });

  it('T-S6-3: Empty: "Safety information is being updated. If you are worried, call 112 or 10177." below the box', async () => {
    listSafetyItems.mockResolvedValue(ok([]));
    openSafety();
    expect(await screen.findByText('Safety information is being updated. If you are worried, call 112 or 10177.')).toBeInTheDocument();
    expect(emergencyBox()).toBeInTheDocument();
  });

  it('T-S6-4: Loading: grey placeholders for the three lists; the emergency box shows at once', () => {
    listSafetyItems.mockReturnValue(new Promise(() => undefined));
    openSafety();
    expect(emergencyBox()).toHaveTextContent(emergencyText);
    expect(screen.getByTestId('loading-placeholder').querySelectorAll('[data-shape="list"]')).toHaveLength(3);
  });

  it('T-S6-5: Error: below the box, "We couldn\'t load the lists. Please try again." with "Try again"', async () => {
    listSafetyItems.mockResolvedValueOnce({ ok: false, code: 'server' });
    openSafety();
    expect(await screen.findByText("We couldn't load the lists. Please try again.")).toBeInTheDocument();
    expect(emergencyBox()).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Shaking or feeling jittery')).toBeInTheDocument();
  });

  it('T-S6-4: loading longer than 3 seconds shows the error state, still under the box', () => {
    vi.useFakeTimers();
    try {
      listSafetyItems.mockReturnValue(new Promise(() => undefined));
      openSafety();
      act(() => vi.advanceTimersByTime(3000));
      expect(screen.getByText("We couldn't load the lists. Please try again.")).toBeInTheDocument();
      expect(emergencyBox()).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('T-US13-3: offline: the box and the banner show; unloaded lists are replaced by the offline message', async () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    listSafetyItems.mockResolvedValue({ ok: false, code: 'offline' });
    openSafety();
    expect(emergencyBox()).toHaveTextContent(emergencyText);
    expect(screen.getByText("You're offline. Some things may not work until you reconnect.")).toBeInTheDocument();
    expect(await screen.findByText("You're offline. The emergency numbers above still work.")).toBeInTheDocument();
  });

  it('T-BR19-2: with the network blocked, the emergency box still renders', () => {
    listSafetyItems.mockRejectedValue(new TypeError('Failed to fetch'));
    openSafety();
    expect(emergencyBox()).toHaveTextContent(emergencyText);
  });

  it('T-BR15-2: no playful wording on S6', async () => {
    openSafety();
    await screen.findByText('Shaking or feeling jittery');
    const text = screen.getByRole('main').textContent ?? '';
    expect(text).not.toMatch(/!|high five|nice one|nice work|got it|done!|love this/i);
  });
});
