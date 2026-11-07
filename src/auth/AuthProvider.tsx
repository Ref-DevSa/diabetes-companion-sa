import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import { AuthContext, type AuthState } from './AuthContext';
import { readAuthRedirect } from './authRedirect';
import { isSessionTooOld } from './sessionAge';

type SessionState = { session: Session | null; loading: boolean; error: boolean };

/** What the email link put in the address bar, read before Supabase tidies it away. */
function initialRedirect() {
  return typeof window === 'undefined' ? { recovery: false, linkExpired: false } : readAuthRedirect(window.location.hash);
}

/**
 * Keeps the Supabase session for the app: sign-in state, the password-reset (recovery) session,
 * expired email links and the 30-day session rule (PRD Section 5; Section 10 session rule).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ session: null, loading: true, error: false });
  const [redirect] = useState(initialRedirect);
  const [recovery, setRecovery] = useState(redirect.recovery);
  const [linkExpired, setLinkExpired] = useState(redirect.linkExpired);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    async function endIfTooOld(session: Session | null) {
      if (session && isSessionTooOld(session.user.last_sign_in_at)) {
        await getSupabase().auth.signOut({ scope: 'local' });
        if (active) setSessionEnded(true);
        return null;
      }
      return session;
    }

    async function load() {
      try {
        const supabase = getSupabase();
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
          if (!active) return;
          if (event === 'PASSWORD_RECOVERY') setRecovery(true);
          if (event === 'SIGNED_OUT') setRecovery(false);
          if (event === 'SIGNED_IN') setSessionEnded(false);
          setState((current) => ({ ...current, session }));
        });
        unsubscribe = () => listener.subscription.unsubscribe();
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error) {
          setState({ session: null, loading: false, error: true });
          return;
        }
        const session = await endIfTooOld(data.session);
        if (active) setState({ session, loading: false, error: false });
      } catch {
        if (active) setState({ session: null, loading: false, error: true });
      }
    }

    // On every return to the tab, check the 30-day rule again.
    function onVisible() {
      if (document.visibilityState !== 'visible') return;
      void getSupabase()
        .auth.getSession()
        .then(({ data }) => endIfTooOld(data.session))
        .catch(() => undefined);
    }

    void load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      unsubscribe?.();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: false }));
    setAttempt((count) => count + 1);
  }, []);

  const clearNotices = useCallback(() => {
    setLinkExpired(false);
    setSessionEnded(false);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ ...state, retry, recovery, linkExpired, sessionEnded, clearNotices }),
    [state, retry, recovery, linkExpired, sessionEnded, clearNotices],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
