import { describe, expect, it } from 'vitest';
import { tokens } from '../../src/lib/tokens';

/** WCAG 2.x relative luminance of a "#RRGGBB" colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const c = tokens.color;
const white = '#FFFFFF';

describe('T-NFR-7: text colours meet 4.5:1 (PRD 9.4, plan 7.1)', () => {
  it.each([
    ['text on page', c.text, c.background],
    ['secondary text on page', c.textSecondary, c.background],
    ['secondary text on a card', c.textSecondary, c.card],
    ['#1565C0 on white', c.primaryDark, white],
    ['#1A6BD1 links on white', c.primary, white],
    ['#B45309 on white', c.warning, white],
    ['#B91C1C on white', c.error, white],
    ['#15803D on white', c.success, white],
    ['white on #1A6BD1 (primary button)', white, c.primary],
    ['white on #B91C1C (Warning signs, danger button)', white, c.error],
    ['white on #1C1E21 (toast, offline banner)', white, c.text],
    ['#1565C0 on the highlight panel', c.primaryDark, c.primaryTint],
  ])('T-NFR-7: %s', (_name, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it('T-NFR-7: the checker gives the PRD ratio for white on #1A6BD1 (5.16:1)', () => {
    expect(contrast(white, c.primary)).toBeCloseTo(5.16, 1);
  });
});
