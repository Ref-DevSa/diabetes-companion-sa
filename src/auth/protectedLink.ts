/** Screens only a User can open (BR16): S8, S9, S10, S11. */
export const PROTECTED_PATHS = ['/diary', '/checklist', '/dashboard', '/profile'] as const;

export type LinkTarget = { to: string; state?: { from: string } };

/**
 * Where a link to `path` should go. A Visitor following a link to a User-only screen
 * goes to S3 Log in, which remembers the wanted screen (BR16).
 */
export function linkTarget(path: string, signedIn: boolean): LinkTarget {
  const isProtected = (PROTECTED_PATHS as readonly string[]).includes(path);
  if (isProtected && !signedIn) return { to: '/log-in', state: { from: path } };
  return { to: path };
}
