import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export type AuthState = {
  /** The Supabase session, or null for a Visitor. */
  session: Session | null;
  /** True while the app is still finding out whether someone is signed in. */
  loading: boolean;
  /** True when the session could not be checked (server or set-up problem). */
  error: boolean;
  /** Checks the session again after an error. */
  retry: () => void;
  /** True while the person holds a password-reset session from the email link (S4 step 2). */
  recovery: boolean;
  /** True when the person arrived from an email link that was used or older than 1 hour. */
  linkExpired: boolean;
  /** True when the app ended the session (older than 30 days, or the account no longer exists). */
  sessionEnded: boolean;
  /** Clears linkExpired and sessionEnded once the person has seen the message. */
  clearNotices: () => void;
};

export const AuthContext = createContext<AuthState>({
  session: null,
  loading: false,
  error: false,
  retry: () => undefined,
  recovery: false,
  linkExpired: false,
  sessionEnded: false,
  clearNotices: () => undefined,
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/**
 * A User for the app's purposes: someone with a normal session. A password-reset session
 * only lets the person choose a new password; it does not open User screens.
 */
export function isSignedIn(auth: Pick<AuthState, 'session' | 'recovery'>): boolean {
  return Boolean(auth.session) && !auth.recovery;
}
