import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSelector } from '../../src/components/LanguageSelector';
import { i18n, VISITOR_LANGUAGE_KEY } from '../../src/i18n';
import { renderWithProviders } from '../helpers/render';

describe('T-C-2: Language selector', () => {
  it('T-C-2: shows a globe and "EN"', () => {
    renderWithProviders(<LanguageSelector />);
    const button = screen.getByRole('button', { name: /language/i });
    expect(button).toHaveTextContent('EN');
    expect(button.querySelector('svg.lucide-globe')).not.toBeNull();
  });

  it('T-C-2: the menu lists only the enabled languages (English only at the start)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelector />);
    await user.click(screen.getByRole('button', { name: /language/i }));
    const items = screen.getAllByRole('menuitemradio');
    expect(items.map((item) => item.textContent)).toEqual(['English']);
  });

  it('T-C-2: choosing a language changes the app language and saves it on the device for a Visitor', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelector languages={['en', 'zu', 'tn']} />);
    await user.click(screen.getByRole('button', { name: /language/i }));
    expect(screen.getAllByRole('menuitemradio').map((item) => item.textContent)).toEqual([
      'English',
      'isiZulu',
      'Setswana',
    ]);
    await user.click(screen.getByRole('menuitemradio', { name: 'isiZulu' }));
    expect(i18n.language).toBe('zu');
    expect(window.localStorage.getItem(VISITOR_LANGUAGE_KEY)).toBe('zu');
    expect(screen.getByRole('button', { name: /language/i })).toHaveTextContent('ZU');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('T-C-2: is keyboard operable (Enter opens, arrows move, Escape closes)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelector languages={['en', 'zu', 'tn']} />);
    const button = screen.getByRole('button', { name: /language/i });
    button.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'English' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitemradio', { name: 'isiZulu' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('T-C-2: the button is at least 44 px (touch target)', () => {
    renderWithProviders(<LanguageSelector />);
    expect(screen.getByRole('button', { name: /language/i })).toHaveClass('min-h-touch', 'min-w-touch');
  });
});
