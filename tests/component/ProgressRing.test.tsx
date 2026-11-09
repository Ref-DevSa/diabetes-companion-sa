import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressRing } from '../../src/components/ProgressRing';

describe('T-C-21: Progress ring', () => {
  it('T-C-21: 64 px with "X of Y" in the middle (no percentage, D2)', () => {
    render(<ProgressRing done={2} total={5} />);
    const ring = screen.getByRole('progressbar');
    expect(ring).toHaveClass('size-ring');
    expect(ring).toHaveTextContent('2 of 5');
    expect(ring.textContent).not.toContain('%');
    expect(ring).toHaveAttribute('aria-valuenow', '2');
    expect(ring).toHaveAttribute('aria-valuemax', '5');
  });

  it('T-C-21: the ring fills to match: 2 of 5 leaves 3/5 of the circle still to fill', () => {
    render(<ProgressRing done={2} total={5} />);
    const arc = screen.getByRole('progressbar').querySelector('[data-part="arc"]') as SVGElement;
    const length = Number(arc.getAttribute('stroke-dasharray'));
    expect(Number(arc.getAttribute('stroke-dashoffset'))).toBeCloseTo(length * (3 / 5), 3);
  });

  it('T-C-21: it fills in 300 ms', () => {
    render(<ProgressRing done={1} total={4} />);
    const arc = screen.getByRole('progressbar').querySelector('[data-part="arc"]') as SVGElement;
    expect(arc.style.transitionDuration).toBe('300ms');
  });

  it('T-C-21 / T-NFR-13: no animation when the phone asks for reduced motion', () => {
    render(<ProgressRing done={1} total={4} />);
    const arc = screen.getByRole('progressbar').querySelector('[data-part="arc"]') as SVGElement;
    expect(arc).toHaveClass('motion-reduce:transition-none');
  });

  it('T-C-21: an empty Checklist shows an empty ring, not an error', () => {
    render(<ProgressRing done={0} total={0} />);
    expect(screen.getByRole('progressbar')).toHaveTextContent('0 of 0');
  });
});
