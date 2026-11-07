import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlagBadge } from '../../src/components/FlagBadge';

describe('T-C-20: Flag badge', () => {
  it('T-C-20: Low shows a down-arrow icon, the word and orange (#B45309) on white', () => {
    render(<FlagBadge flag="low" />);
    const badge = screen.getByText('Low').closest('[data-flag]');
    expect(badge).toHaveAttribute('data-flag', 'low');
    expect(badge).toHaveClass('text-warning', 'border-warning', 'bg-card');
    expect(badge?.querySelector('svg.lucide-arrow-down')).not.toBeNull();
  });

  it('T-C-20: Very high shows an up-arrow icon, the words and red (#B91C1C) on white', () => {
    render(<FlagBadge flag="very_high" />);
    const badge = screen.getByText('Very high').closest('[data-flag]');
    expect(badge).toHaveClass('text-error', 'border-error', 'bg-card');
    expect(badge?.querySelector('svg.lucide-arrow-up')).not.toBeNull();
  });

  it('T-C-20: never colour alone: icon and word are always there; no Flag shows nothing', () => {
    const { container } = render(<FlagBadge flag={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
