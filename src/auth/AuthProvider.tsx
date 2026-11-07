import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import { AuthContext, type AuthState } from './AuthContext';

type SessionState = { session: Session | null; loading: boolean; error: boolean };

/**
 * Exposes the Supabase session to the app (Phase 1: read only).
 * Log-in, sign-up and the 30-day session rule are added in Phase 3.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ session: null, loading: true, error: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    async function load() {
      try {
        const supabase = getSupabase();
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          if (active) setState((current) => ({ ...current, session }));
        });
        unsubscribe = () => listener.subscription.unsubscribe();
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;
        setState(error ? { session: null, loading: false, error: true } : { session: data.session, loading: false, error: false });
      } catch {
        if (active) setState({ session: null, loading: false, error: true });
      }
    }

    void load();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: false }));
    setAttempt((count) => count + 1);
  }, []);

  const value = useMemo<AuthState>(() => ({ ...state, retry }), [state, retry]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
