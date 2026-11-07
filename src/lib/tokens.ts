/**
 * Design tokens from IMPLEMENTATION_PLAN.md Section 7.1 (PRD 9.1, 9.3, 8.3).
 * Mirrors the Tailwind theme in src/styles/index.css; tests check both stay the same.
 * Screens use the Tailwind classes, never these raw values.
 */
export const tokens = {
  color: {
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
  },
  font: {
    family: 'Inter',
    weights: [400, 600, 700],
    size: { title: '24px', heading: '20px', body: '16px', small: '12px' },
  },
  space: { 1: '4px', 2: '8px', 3: '16px', 4: '24px', 5: '32px', margin: '16px' },
  radius: { card: '12px', input: '12px', button: '12px' },
  shadow: { card: '0 1px 3px rgb(0 0 0 / 0.08), 0 1px 2px rgb(0 0 0 / 0.04)' },
  size: {
    button: '48px',
    touchMin: '44px',
    header: '56px',
    tabBar: '56px',
    ring: '64px',
    dialogMax: '328px',
  },
  focus: { width: '2px', color: '#1565C0', offset: '2px' },
  motion: { ring: 300, toast: 3000 },
  breakpoint: { tablet: '640px', desktop: '1024px' },
  layout: { maxWidth: { tablet: '720px', desktop: '1200px' } },
} as const;

/** How long a data screen may show placeholders before it shows its error state (PRD 8.3, 12.1). */
export const LOADING_LIMIT_MS = 3000;
