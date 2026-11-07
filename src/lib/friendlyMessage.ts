/** BR14: the five friendly messages (i18n keys) after a Reading is saved without a Flag. */
export const FRIENDLY_MESSAGE_KEYS = ['friendly.m1', 'friendly.m2', 'friendly.m3', 'friendly.m4', 'friendly.m5'] as const;

/** One of the five at random, never the same as the previous one. */
export function pickFriendlyMessage(previous: string | null, random: () => number = Math.random): string {
  const choices = FRIENDLY_MESSAGE_KEYS.filter((key) => key !== previous);
  const index = Math.min(choices.length - 1, Math.floor(random() * choices.length));
  return choices[index] as string;
}
