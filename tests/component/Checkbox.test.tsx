import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '../../src/components/Checkbox';

function PrivacyBox({ onLink, error }: { onLink?: () => void; error?: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <Checkbox
      checked={checked}
      onChange={(event) => setChecked(event.target.checked)}
      error={error}
      label={
        <>
          I agree to the{' '}
          <a
            href="#privacy"
            onClick={(event) => {
              event.preventDefault();
              onLink?.();
            }}
          >
            Privacy Notice
          </a>
        </>
      }
    />
  );
}

describe('T-C-8: Checkbox', () => {
  it('T-C-8: starts unticked and ticks when tapped', async () => {
    const user = userEvent.setup();
    render(<PrivacyBox />);
    const box = screen.getByRole('checkbox', { name: /I agree to the Privacy Notice/ });
    expect(box).not.toBeChecked();
    await user.click(box);
    expect(box).toBeChecked();
  });

  it('T-C-8: has a 44 px touch target', () => {
    render(<PrivacyBox />);
    const box = screen.getByRole('checkbox');
    expect(box.closest('label')).toHaveClass('min-h-touch');
    expect(box.parentElement).toHaveClass('min-h-touch', 'min-w-touch');
  });

  it('T-C-8: the link in the label can be tapped without ticking the box', async () => {
    const user = userEvent.setup();
    const onLink = vi.fn();
    render(<PrivacyBox onLink={onLink} />);
    await user.click(screen.getByRole('link', { name: 'Privacy Notice' }));
    expect(onLink).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('T-C-8: error state shows the message under the box', () => {
    render(<PrivacyBox error="Please agree to the Privacy Notice to continue." />);
    const box = screen.getByRole('checkbox');
    const message = screen.getByText('Please agree to the Privacy Notice to continue.');
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(box).toHaveAttribute('aria-describedby', message.id);
    expect(message).toHaveClass('text-error');
  });
});
