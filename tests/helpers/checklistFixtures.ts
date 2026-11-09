// Thabo's Checklist from PRD 8.4 for component tests (no network).
import type { ChecklistItem, TodayChecklist } from '../../src/data/checklist';

export const standardItems: ChecklistItem[] = [
  { id: 'std-medication', isStandard: true, standardKey: 'medication', name: 'Take my medication as prescribed' },
  { id: 'std-glucose', isStandard: true, standardKey: 'glucose_check', name: 'Check my glucose if my care plan says so' },
  { id: 'std-water', isStandard: true, standardKey: 'water', name: 'Drink water' },
  { id: 'std-activity', isStandard: true, standardKey: 'activity', name: 'Do suitable physical activity' },
];

export const eveningWalk: ChecklistItem = { id: 'custom-walk', isStandard: false, standardKey: null, name: 'Evening walk' };

export function checklist(items: ChecklistItem[], tickedIds: string[] = [], date = '2026-10-27'): TodayChecklist {
  return { date, items, tickedIds };
}

/** PRD 8.4: medication and water ticked; Evening walk added. */
export const thaboChecklist = checklist([...standardItems, eveningWalk], ['std-medication', 'std-water']);

export function customItems(n: number): ChecklistItem[] {
  return Array.from({ length: n }, (_, i) => ({ id: `custom-${i + 1}`, isStandard: false, standardKey: null, name: `Item ${i + 1}` }));
}
