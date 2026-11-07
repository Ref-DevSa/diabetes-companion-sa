import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import en from '../../src/i18n/en.json';

describe('T-S6-6: the emergency box is built into the app (BR19)', () => {
  it('T-S6-6: the exact PRD S6 text is a constant in the app language file', () => {
    expect(en.safety.emergencyTitle).toBe('In an emergency, get help now');
    expect(en.safety.emergencyText).toBe(
      'Call 112 from a cell phone or 10177 for an ambulance, or go to the nearest hospital. Do not wait for this app.',
    );
  });

  it('T-S6-6: the emergency box never loads anything from the database or the network', () => {
    const source = readFileSync('src/components/EmergencyBox.tsx', 'utf8');
    expect(source).not.toMatch(/supabase|\/data\/|fetch\(|useEffect/);
  });
});
