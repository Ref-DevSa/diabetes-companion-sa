import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopicCard } from '../../src/components/TopicCard';
import { fakeTopics } from '../helpers/contentFixtures';

const topic = fakeTopics[0]!;

describe('T-C-18: Topic card', () => {
  it('T-C-18: shows an icon, the title (20 px bold), the summary and the reading time', () => {
    render(<TopicCard topic={topic} open={false} onToggle={vi.fn()} />);
    const title = screen.getByRole('heading', { name: 'What is diabetes?' });
    expect(title).toHaveClass('text-heading', 'font-bold');
    expect(screen.getByText('The basics in plain words')).toBeInTheDocument();
    expect(screen.getByText('3 min read')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /What is diabetes\?/ }).querySelector('svg')).not.toBeNull();
  });

  it('T-C-18: closed, the full text is hidden; tapping asks to open it in place', async () => {
    const onToggle = vi.fn();
    render(<TopicCard topic={topic} open={false} onToggle={onToggle} />);
    const button = screen.getByRole('button', { name: /What is diabetes\?/ });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Body text for What is diabetes?')).not.toBeInTheDocument();
    await userEvent.setup().click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('T-C-18: open, it shows the full text in 16 px, the review date and "Close"', async () => {
    const onToggle = vi.fn();
    render(<TopicCard topic={topic} open onToggle={onToggle} />);
    expect(screen.getByRole('button', { name: /What is diabetes\?/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Body text for What is diabetes?')).toHaveClass('text-body');
    expect(screen.getByText('Content last reviewed: 27 Oct 2026')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Close' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
