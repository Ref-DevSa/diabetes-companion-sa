import { useCallback, useEffect, useRef, useState } from 'react';
import { isOfflineNow, type ErrorCode, type Result } from '../lib/errors';

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; code: ErrorCode };

/**
 * Loads data for a screen (PRD 8.3, 12.1): placeholders first; after 3 seconds the screen calls
 * `timeout` and shows its error; "Try again" calls `retry`. Loads again when `key` changes
 * (for example the language) and, after an offline failure, when the phone reconnects.
 */
export function useLoad<T>(load: () => Promise<Result<T>>, key: string) {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const loadRef = useRef(load);

  const stateRef = useRef(state);

  useEffect(() => {
    loadRef.current = load;
    stateRef.current = state;
  });

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => loadRef.current())
      .then((result) => {
        if (!active) return;
        setState(result.ok ? { status: 'ready', data: result.data } : { status: 'error', code: result.code });
      })
      .catch(() => {
        if (active) setState({ status: 'error', code: isOfflineNow() ? 'offline' : 'server' });
      });
    return () => {
      active = false;
    };
  }, [key, attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((count) => count + 1);
  }, []);

  const timeout = useCallback(() => {
    setState((current) => (current.status === 'loading' ? { status: 'error', code: isOfflineNow() ? 'offline' : 'server' } : current));
  }, []);

  // Back online after an offline failure: try again by itself.
  useEffect(() => {
    function onOnline() {
      const current = stateRef.current;
      if (current.status === 'error' && current.code === 'offline') retry();
    }
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [retry]);

  /**
   * Replaces the loaded data after a confirmed save (for example a new language). Pass a function
   * to change the latest data, when several saves can finish in any order (Checklist ticks).
   */
  const update = useCallback((next: T | ((current: T) => T)) => {
    setState((current) => {
      if (typeof next !== 'function') return { status: 'ready', data: next };
      return current.status === 'ready' ? { status: 'ready', data: (next as (current: T) => T)(current.data) } : current;
    });
  }, []);

  return { state, retry, timeout, update };
}
