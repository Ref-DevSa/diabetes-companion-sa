import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField } from '../../src/components/TextField';

function EmailField({ error }: { error?: string }) {
  const [value, setValue] = useState('');
  return (
    <TextField
      label="Email"
      type="email"
      placeholder="you@example.co.za"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      error={error}
    />
  );
}

describe('T-C-6: Text field', () => {
  it('T-C-6: label above the input, 48 px high, 12 px corners, focus outline', () => {
    render(<EmailField />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('placeholder', 'you@example.co.za');
    expect(input).toHaveClass('h-button', 'rounded-input', 'focus-ring');
    const label = screen.getByText('Email');
    expect(label.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('T-C-6: shows a message below the input', () => {
    render(<TextField label="Note" message="0/200" />);
    const input = screen.getByLabelText('Note');
    const message = screen.getByText('0/200');
    expect(input).toHaveAttribute('aria-describedby', message.id);
  });

  it('T-C-6: error shows a red border, an icon and the message, and keeps the typed text', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<EmailField />);
    await user.type(screen.getByLabelText('Email'), 'thabo.test');
    rerender(<EmailField error="Enter a valid email address." />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveValue('thabo.test');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveClass('border-error');
    const message = screen.getByText('Enter a valid email address.');
    expect(message).toHaveClass('text-error');
    expect(input).toHaveAttribute('aria-describedby', expect.stringContaining(message.id));
    expect(message.parentElement?.querySelector('svg.lucide-circle-alert')).not.toBeNull();
  });
});
