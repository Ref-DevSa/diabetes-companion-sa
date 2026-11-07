import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlagMessage } from '../../src/components/FlagMessage';

describe('BR6: Flag messages', () => {
  it('T-BR6-1: Low shows the exact PRD message on a white card with an orange border', () => {
    render(<FlagMessage flag="low" />);
    const message = screen.getByText('Your reading is low. Follow your care plan and talk to your clinic.');
    expect(message.closest('[data-flag]')).toHaveClass('bg-card', 'border-warning');
  });

  it('T-BR6-1: Very high shows the exact PRD message on a white card with a red border', () => {
    render(<FlagMessage flag="very_high" />);
    const message = screen.getByText('Your reading is very high. Talk to your clinic today.');
    expect(message.closest('[data-flag]')).toHaveClass('bg-card', 'border-error');
  });

  it('T-BR6-2: no Flag, no message; and never any playful wording with a Flag', () => {
    const { container, rerender } = render(<FlagMessage flag={null} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<FlagMessage flag="low" />);
    expect(container.textContent).not.toMatch(/!|high five|nice one|got it|love this/i);
  });
});
