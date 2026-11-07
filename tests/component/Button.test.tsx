import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../src/components/Button';

describe('T-C-5: Button', () => {
  it('T-C-5: primary is blue with white semi-bold text, 48 px high, 12 px corners', () => {
    render(<Button>Create free account</Button>);
    const button = screen.getByRole('button', { name: 'Create free account' });
    expect(button).toHaveClass('h-button', 'rounded-button', 'bg-primary', 'text-white', 'font-semibold', 'text-body');
    expect(button).toHaveClass('active:bg-primary-dark');
  });

  it('T-C-5: secondary has a white fill, a 2 px blue border and blue text', () => {
    render(<Button variant="secondary">Log in</Button>);
    expect(screen.getByRole('button', { name: 'Log in' })).toHaveClass(
      'h-button',
      'bg-card',
      'border-2',
      'border-primary-dark',
      'text-primary-dark',
    );
  });

  it('T-C-5: danger is red with white text', () => {
    render(<Button variant="danger">Delete account</Button>);
    expect(screen.getByRole('button', { name: 'Delete account' })).toHaveClass('h-button', 'bg-error', 'text-white');
  });

  it('T-C-5: disabled is grey #D0D5DD and cannot be pressed', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('bg-disabled');
    expect(button).not.toHaveClass('bg-primary');
    await userEvent.setup().click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('T-C-5: loading shows the given label and is disabled', () => {
    render(
      <Button loading loadingLabel="Saving…">
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Saving…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('T-C-5: has the keyboard focus outline', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('focus-ring');
  });
});
