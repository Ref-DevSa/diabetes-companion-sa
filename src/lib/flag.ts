import type { ReadingWhen } from './readingRules';

/** BR5: the Flag on a Reading. Worked out from value and When; never stored. */
export type Flag = 'low' | 'very_high' | null;

const LOW_BELOW = 3.9;
const VERY_HIGH_ABOVE = 16.5;
const FASTING_VERY_HIGH_ABOVE = 14.0;

/**
 * "Low" below 3.9. "Very high" above 16.5, or above 14.0 when Fasting. Exactly 3.9, 14.0 and 16.5
 * are not flagged. These limits must be reviewed by a qualified person before launch (PRD A3, gate L1).
 */
export function getFlag(value: number, when: ReadingWhen): Flag {
  if (value < LOW_BELOW) return 'low';
  if (value > VERY_HIGH_ABOVE) return 'very_high';
  if (when === 'fasting' && value > FASTING_VERY_HIGH_ABOVE) return 'very_high';
  return null;
}
