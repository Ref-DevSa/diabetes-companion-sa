import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordField } from '../../src/components/PasswordField';

describe('T-C-7: Password field', () => {
  it('T-C-7: starts hidden; the toggle shows and hides the password', async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Password" placeholder="At least 8 characters and 1 number" />);
    const input = screen.getByLabelText('Password');
    await user.type(input, 'abcdefg1');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveValue('abcdefg1');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('T-C-7: the toggle is an icon button with a text label and a 44 px target', () => {
    render(<PasswordField label="Password" />);
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle.querySelector('svg')).not.toBeNull();
    expect(toggle).toHaveClass('min-h-touch', 'min-w-touch');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('T-C-7: shows an error like a text field', () => {
    render(<PasswordField label="Password" error="Password must be at least 8 characters and include a number." />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Password must be at least 8 characters and include a number.')).toBeInTheDocument();
  });
});
