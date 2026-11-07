import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from '../../src/components/Logo';

describe('T-C-22: Logo', () => {
  it('T-C-22: a blue rounded-square icon with a white drop and tick', () => {
    const { container } = render(<Logo />);
    const icon = container.querySelector('svg');
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    const square = icon?.querySelector('rect');
    expect(square).toHaveAttribute('fill', '#1A6BD1');
    expect(Number(square?.getAttribute('rx'))).toBeGreaterThan(0);
    expect(icon?.querySelector('[data-part="drop"]')).toHaveAttribute('fill', '#FFFFFF');
    expect(icon?.querySelector('[data-part="tick"]')).not.toBeNull();
  });

  it('T-C-22: never uses a blue circle (IDF protected symbol)', () => {
    const { container } = render(<Logo />);
    expect(container.querySelector('circle')).toBeNull();
    expect(container.querySelector('ellipse')).toBeNull();
  });

  it('T-C-22: wordmark "Diabetes Companion" with a blue "SA", hidden below 400 px', () => {
    render(<Logo />);
    const sa = screen.getByText('SA', { selector: '[data-part="wordmark"] span' });
    expect(sa).toHaveClass('text-primary');
    const wordmark = sa.closest('[data-part="wordmark"]');
    expect(wordmark).toHaveTextContent('Diabetes Companion SA');
    expect(wordmark).toHaveClass('hidden', 'wordmark:inline');
    expect(wordmark).toHaveAttribute('aria-hidden', 'true');
  });

  it('T-C-22: always has a text name for screen readers', () => {
    render(<Logo />);
    expect(screen.getByText('Diabetes Companion SA', { selector: '.sr-only' })).toBeInTheDocument();
  });
});
