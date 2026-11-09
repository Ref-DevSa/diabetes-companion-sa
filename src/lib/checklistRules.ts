// Checklist rules BR10, BR11 and BR13 (PRD 5). The database checks BR11 again (Section 8.6).

/** BR10: the four Standard Items, in the PRD order. Their names are translated by this key. */
export const STANDARD_KEYS = ['medication', 'glucose_check', 'water', 'activity'] as const;
export type StandardKey = (typeof STANDARD_KEYS)[number];

export function isStandardKey(value: unknown): value is StandardKey {
  return typeof value === 'string' && (STANDARD_KEYS as readonly string[]).includes(value);
}

/** BR11: at most 6 Custom Items for each User. */
export const CUSTOM_ITEM_LIMIT = 6;

/** BR11: a Custom Item name is 1 to 60 characters. */
export const ITEM_NAME_MAX = 60;

export type ItemNameError = 'errors.itemNameRequired' | 'errors.itemNameTooLong' | 'errors.itemNameTaken';

/** BR11 names are compared ignoring capitals and outer spaces (as the unique index does). */
function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function canAddCustomItem(customCount: number): boolean {
  return customCount < CUSTOM_ITEM_LIMIT;
}

/**
 * BR11: checks a Custom Item name. `existingNames` are the User's Custom Item names;
 * `currentName` is the Item's own name when renaming, so new capitals are allowed.
 */
export function validateItemName(name: string, existingNames: string[], currentName?: string): ItemNameError | null {
  const trimmed = name.trim();
  if (trimmed === '') return 'errors.itemNameRequired';
  if (trimmed.length > ITEM_NAME_MAX) return 'errors.itemNameTooLong';
  const taken = existingNames.some((existing) => sameName(existing, trimmed) && !(currentName !== undefined && sameName(existing, currentName)));
  return taken ? 'errors.itemNameTaken' : null;
}

/** BR13: "X of Y done"; only ticks for Items on today's Checklist count. */
export function checklistProgress(itemIds: string[], tickedIds: string[]): { done: number; total: number; allDone: boolean } {
  const ticked = new Set(tickedIds);
  const done = itemIds.filter((id) => ticked.has(id)).length;
  const total = itemIds.length;
  return { done, total, allDone: total > 0 && done === total };
}
