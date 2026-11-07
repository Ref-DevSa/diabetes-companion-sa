/**
 * Development-only stand-in for a screen that is built in a later phase (Section 7.3, routing note).
 * It shows only the screen ID, never user-facing wording. Each one is replaced in its phase;
 * the /help placeholder is removed in Phase 7 (T-NAV-9).
 */
export function DevPlaceholder({ screen }: { screen: string }) {
  return (
    <p data-testid="dev-placeholder" className="text-small text-text-secondary">
      {screen}
    </p>
  );
}
