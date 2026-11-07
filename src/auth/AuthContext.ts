import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export type AuthState = {
  /** The signed-in User's session, or null for a Visitor. */
  session: Session | null;
  /** True while the app is still finding out whether someone is signed in. */
  loading: boolean;
  /** True when the session could not be checked (server or set-up problem). */
  error: boolean;
  /** Checks the session again after an error. */
  retry: () => void;
};

export const AuthContext = createContext<AuthState>({
  session: null,
  loading: false,
  error: false,
  retry: () => undefined,
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
