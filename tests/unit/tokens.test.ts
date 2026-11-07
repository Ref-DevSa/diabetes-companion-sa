import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { tokens } from '../../src/lib/tokens';

describe('T-SETUP-2: design tokens (Section 7.1)', () => {
  it('T-SETUP-2: colours have the exact values', () => {
    expect(tokens.color).toEqual({
      primary: '#1A6BD1',
      primaryDark: '#1565C0',
      primaryTint: '#E7F0FD',
      background: '#F0F2F5',
      card: '#FFFFFF',
      text: '#1C1E21',
      textSecondary: '#65676B',
      error: '#B91C1C',
      success: '#15803D',
      warning: '#B45309',
      disabled: '#D0D5DD',
      placeholder: '#E4E6EB',
    });
  });

  it('T-SETUP-2: font, spacing, radius, sizes, focus, motion and layout have the exact values', () => {
    expect(tokens.font.family).toBe('Inter');
    expect(tokens.font.weights).toEqual([400, 600, 700]);
    expect(tokens.font.size).toEqual({ title: '24px', heading: '20px', body: '16px', small: '12px' });
    expect(tokens.space).toEqual({ 1: '4px', 2: '8px', 3: '16px', 4: '24px', 5: '32px', margin: '16px' });
    expect(tokens.radius).toEqual({ card: '12px', input: '12px', button: '12px' });
    expect(tokens.shadow.card).toBeTruthy();
    expect(tokens.size).toEqual({
      button: '48px',
      touchMin: '44px',
      header: '56px',
      tabBar: '56px',
      ring: '64px',
      dialogMax: '328px',
    });
    expect(tokens.focus).toEqual({ width: '2px', color: '#1565C0', offset: '2px' });
    expect(tokens.motion).toEqual({ ring: 300, toast: 3000 });
    expect(tokens.breakpoint).toEqual({ tablet: '640px', desktop: '1024px' });
    expect(tokens.layout.maxWidth).toEqual({ tablet: '720px', desktop: '1200px' });
  });

  it('T-SETUP-2: the Tailwind theme in src/styles/index.css uses the same values', () => {
    const css = readFileSync('src/styles/index.css', 'utf8').toUpperCase();
    for (const value of Object.values(tokens.color)) {
      expect(css).toContain(value.toUpperCase());
    }
    for (const value of ['24PX', '20PX', '16PX', '12PX', '48PX', '44PX', '56PX', '64PX', '328PX', '640PX', '1024PX', '720PX', '1200PX']) {
      expect(css).toContain(value);
    }
  });
});
