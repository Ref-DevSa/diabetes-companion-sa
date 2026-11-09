import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../src/App';
import * as content from '../../src/data/content';
import { i18n } from '../../src/i18n';
import { ok } from '../../src/lib/errors';
import { fakeTopics } from '../helpers/contentFixtures';
import { renderWithProviders } from '../helpers/render';

vi.mock('../../src/data/content', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/data/content')>();
  return { ...original, listTopics: vi.fn(), listSafetyItems: vi.fn() };
});

const listTopics = vi.mocked(content.listTopics);
const disclaimer = 'This app gives general information only. It does not diagnose or replace your clinic.';

function openLearn() {
  return renderWithProviders(<AppRoutes />, { route: '/learn' });
}

describe('S5 Learning Centre', () => {
  beforeEach(() => {
    listTopics.mockReset().mockResolvedValue(ok(fakeTopics));
  });
  afterEach(() => vi.restoreAllMocks());

  it('T-S5-1: title, text and six Topic cards in order; the Learn tab is active', async () => {
    openLearn();
    expect(await screen.findByRole('heading', { name: 'What is diabetes?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Learn' })).toBeInTheDocument();
    expect(screen.getByText('Short Topics in plain words. Tap one to read it.')).toBeInTheDocument();
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(titles).toEqual(fakeTopics.map((t) => t.title));
    expect(screen.getByRole('link', { name: 'Learn' })).toHaveAttribute('aria-current', 'page');
  });

  it('T-S5-4: the link card "Help for family and caregivers" goes to S7', async () => {
    openLearn();
    await screen.findByRole('heading', { name: 'What is diabetes?' });
    await userEvent.setup().click(screen.getByRole('link', { name: /Help for family and caregivers/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/help');
  });

  it('T-S5-5: the disclaimer notice shows (design correction D12)', async () => {
    openLearn();
    expect(await screen.findByText(disclaimer)).toBeInTheDocument();
  });

  it('T-US11-1: tapping "What is diabetes?" opens the full Topic in place and "Close" closes it', async () => {
    const user = userEvent.setup();
    openLearn();
    await user.click(await screen.findByRole('button', { name: /What is diabetes\?/ }));
    expect(screen.getByText('Body text for What is diabetes?')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/learn');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Body text for What is diabetes?')).not.toBeInTheDocument();
  });

  it('T-US11-1: opening another Topic closes the first one', async () => {
    const user = userEvent.setup();
    openLearn();
    await user.click(await screen.findByRole('button', { name: /What is diabetes\?/ }));
    await user.click(screen.getByRole('button', { name: /Eating well/ }));
    expect(screen.queryByText('Body text for What is diabetes?')).not.toBeInTheDocument();
    expect(screen.getByText('Body text for Eating well')).toBeInTheDocument();
  });

  it('T-BR22-3: an open Topic shows "Content last reviewed:" with its review date', async () => {
    const user = userEvent.setup();
    openLearn();
    await user.click(await screen.findByRole('button', { name: /What is diabetes\?/ }));
    expect(screen.getByText('Content last reviewed: 27 Oct 2026')).toBeInTheDocument();
  });

  it('T-US11-2: in Setswana the Topics are asked for and shown in Setswana', async () => {
    listTopics.mockImplementation(async (language) =>
      ok(fakeTopics.map((t) => (language === 'tn' ? { ...t, title: `TN-TEST ${t.title}` } : t))),
    );
    await act(() => i18n.changeLanguage('tn'));
    openLearn();
    expect(await screen.findByRole('heading', { name: 'TN-TEST What is diabetes?' })).toBeInTheDocument();
    expect(listTopics).toHaveBeenLastCalledWith('tn');
  });

  it('T-US11-2: changing the language loads the Topics again in the new language', async () => {
    openLearn();
    await screen.findByRole('heading', { name: 'What is diabetes?' });
    await act(() => i18n.changeLanguage('zu'));
    await waitFor(() => expect(listTopics).toHaveBeenLastCalledWith('zu'));
  });

  it('T-BR21-2: a Topic with reviewed Setswana text shows it; one without shows English', async () => {
    const rows = [
      { id: '1', slug: 'a', title_en: 'Eating well', title_tn: 'Go ja sentle', summary_en: 'S', body_en: 'B', reading_minutes: 4, reviewed_at: '2026-10-27' },
      { id: '2', slug: 'b', title_en: 'Moving more', title_tn: null, summary_en: 'S', body_en: 'B', reading_minutes: 3, reviewed_at: '2026-10-27' },
    ];
    listTopics.mockImplementation(async (language) => ok(rows.map((row) => content.localizeTopic(row, language))));
    await act(() => i18n.changeLanguage('tn'));
    openLearn();
    expect(await screen.findByRole('heading', { name: 'Go ja sentle' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Moving more' })).toBeInTheDocument();
  });

  it('T-BR21-2: the language menu lists only the enabled languages (English until reviews are recorded)', async () => {
    const user = userEvent.setup();
    openLearn();
    await user.click(screen.getByRole('button', { name: /language/i }));
    expect(screen.getAllByRole('menuitemradio').map((item) => item.textContent)).toEqual(['English']);
  });

  it('T-S5-2: Empty shows "No topics yet. Please check back soon."', async () => {
    listTopics.mockResolvedValue(ok([]));
    openLearn();
    expect(await screen.findByText('No topics yet. Please check back soon.')).toBeInTheDocument();
  });

  it('T-S5-3: Loading shows three grey card placeholders', () => {
    listTopics.mockReturnValue(new Promise(() => undefined));
    openLearn();
    expect(screen.getByTestId('loading-placeholder').querySelectorAll('[data-shape="card"]')).toHaveLength(3);
  });

  it('T-S5-3: loading longer than 3 seconds shows the error state', () => {
    vi.useFakeTimers();
    try {
      listTopics.mockReturnValue(new Promise(() => undefined));
      openLearn();
      act(() => vi.advanceTimersByTime(3000));
      expect(screen.getByText("We couldn't load the Topics. Please try again.")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('T-US11-4: a server failure shows the message and "Try again", which reloads', async () => {
    listTopics.mockResolvedValueOnce({ ok: false, code: 'server' });
    openLearn();
    expect(await screen.findByText("We couldn't load the Topics. Please try again.")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'What is diabetes?' })).toBeInTheDocument();
  });

  it('T-US11-3: offline with no Topics loaded shows "You\'re offline. Reconnect to read Topics."', async () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    listTopics.mockResolvedValue({ ok: false, code: 'offline' });
    openLearn();
    expect(await screen.findByText("You're offline. Reconnect to read Topics.")).toBeInTheDocument();
    expect(screen.getByText("You're offline. Some things may not work until you reconnect.")).toBeInTheDocument();
    expect(screen.queryByText("We couldn't load the Topics. Please try again.")).not.toBeInTheDocument();
  });

  it('T-US11-3: Topics already loaded stay readable when the phone goes offline', async () => {
    openLearn();
    await screen.findByRole('heading', { name: 'What is diabetes?' });
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByRole('heading', { name: 'What is diabetes?' })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).queryByText("You're offline. Reconnect to read Topics.")).not.toBeInTheDocument();
  });

  it('T-EDGE-10: a Topic with no text in the chosen language shows the English text, with no message about it', async () => {
    const row = {
      id: 'zu-missing',
      slug: 'what-is-diabetes',
      title_en: 'What is diabetes?',
      summary_en: 'The basics in plain words',
      body_en: 'Body text for What is diabetes?',
      title_zu: null,
      summary_zu: null,
      body_zu: null,
      reading_minutes: 3,
      reviewed_at: '2026-10-27',
    };
    listTopics.mockResolvedValue(ok([content.localizeTopic(row, 'zu')]));
    const user = userEvent.setup();
    openLearn();
    await user.click(await screen.findByRole('button', { name: /What is diabetes?/ }));
    expect(screen.getByText('Body text for What is diabetes?')).toBeInTheDocument();
    expect(screen.getByRole('main').textContent).not.toMatch(/translat|not available|English only/i);
  });
});
