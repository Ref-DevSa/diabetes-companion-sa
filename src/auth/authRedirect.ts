/**
 * Reads the address Supabase sends a person back to after they tap an email link.
 * A valid reset link arrives as "#access_token=...&type=recovery"; a used or expired link
 * arrives as "#error=access_denied&error_code=otp_expired&...". Nothing here is logged.
 */
export function readAuthRedirect(hash: string): { recovery: boolean; linkExpired: boolean } {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const linkExpired = params.has('error_code') || params.has('error');
  return { recovery: !linkExpired && params.get('type') === 'recovery', linkExpired };
}
