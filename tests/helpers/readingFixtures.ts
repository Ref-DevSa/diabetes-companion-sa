// Thabo's five sample Readings from PRD 8.4, for component tests (no network).
import type { Reading } from '../../src/data/readings';

export const fakeReadings: Reading[] = [
  { id: 'r1', value: 6.8, when: 'fasting', takenAt: '2026-10-27T05:10:00Z', note: null },
  { id: 'r2', value: 3.6, when: 'bedtime', takenAt: '2026-10-26T19:30:00Z', note: 'Skipped supper' },
  { id: 'r3', value: 9.4, when: 'after_meal', takenAt: '2026-10-26T17:45:00Z', note: null },
  { id: 'r4', value: 14.6, when: 'fasting', takenAt: '2026-10-26T05:20:00Z', note: 'Felt very thirsty' },
  { id: 'r5', value: 7.2, when: 'before_meal', takenAt: '2026-10-25T10:40:00Z', note: null },
];

/** n Readings, one an hour apart, newest first. */
export function manyReadings(n: number, startMs = Date.parse('2026-10-27T06:00:00Z')): Reading[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `m${i + 1}`,
    value: Number((5 + i / 10).toFixed(1)),
    when: 'other' as const,
    takenAt: new Date(startMs - i * 60 * 60 * 1000).toISOString(),
    note: null,
  }));
}
