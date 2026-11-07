import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadingCard } from '../../src/components/ReadingCard';
import { fakeReadings } from '../helpers/readingFixtures';

const [fasting68, bedtime36] = fakeReadings as [(typeof fakeReadings)[0], (typeof fakeReadings)[0]];

describe('T-C-19: Reading card', () => {
  afterEach(() => vi.restoreAllMocks());

  it('T-C-19: shows the value (20 px bold), When, date and time, and Edit and Delete', () => {
    render(<ReadingCard reading={fasting68} onEdit={vi.fn()} onDelete={vi.fn()} />);
    const value = screen.getByText('6.8');
    expect(value).toHaveClass('text-heading', 'font-bold');
    expect(value.parentElement).toHaveTextContent('6.8 mmol/L');
    expect(screen.getByText('Fasting')).toBeInTheDocument();
    expect(screen.getByText('27 Oct 2026, 07:10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByText(/Low|Very high/)).not.toBeInTheDocument();
  });

  it('T-C-19: a flagged Reading shows the badge, its message and the note', () => {
    render(<ReadingCard reading={bedtime36} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Your reading is low. Follow your care plan and talk to your clinic.')).toBeInTheDocument();
    expect(screen.getByText('Skipped supper')).toBeInTheDocument();
  });

  it('T-C-19: Edit and Delete call back with the Reading', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<ReadingCard reading={fasting68} onEdit={onEdit} onDelete={onDelete} />);
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onEdit).toHaveBeenCalledWith(fasting68);
    expect(onDelete).toHaveBeenCalledWith(fasting68);
  });

  it('T-C-19: Edit and Delete are disabled while offline', () => {
    render(<ReadingCard reading={fasting68} disabled onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });
});
