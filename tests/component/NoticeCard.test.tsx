import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NoticeCard } from '../../src/components/NoticeCard';

describe('T-C-10: Notice card', () => {
  it('T-C-10: shows the given notice text on a card', () => {
    render(<NoticeCard>This app gives general information only. It does not diagnose or replace your clinic.</NoticeCard>);
    const text = screen.getByText('This app gives general information only. It does not diagnose or replace your clinic.');
    expect(text).toBeInTheDocument();
    expect(text.closest('.bg-card')).not.toBeNull();
  });
});
