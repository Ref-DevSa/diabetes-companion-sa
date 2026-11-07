import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../../src/components/Card';

describe('T-C-9: Card', () => {
  it('T-C-9: white, 16 px padding, 12 px corners, soft shadow', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content')).toHaveClass('bg-card', 'p-4', 'rounded-card', 'shadow-card');
  });

  it('T-C-9: can have a coloured border', () => {
    render(<Card border="error">Emergency</Card>);
    expect(screen.getByText('Emergency')).toHaveClass('border-2', 'border-error', 'bg-card');
  });

  it('T-C-9: renders as the element it is given', () => {
    render(<Card as="section">Section</Card>);
    expect(screen.getByText('Section').tagName).toBe('SECTION');
  });
});
