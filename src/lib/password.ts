/** PRD Section 5: at least 8 characters, including at least 1 number. */
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && /\d/.test(password);
}

/** A simple shape check (name@domain.tld); the real check is the confirmation email. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** S4 step 2: null when the new password can be saved, otherwise which message to show. */
export function checkNewPassword(password: string, confirmation: string): 'weak' | 'mismatch' | null {
  if (!isValidPassword(password)) return 'weak';
  if (password !== confirmation) return 'mismatch';
  return null;
}
