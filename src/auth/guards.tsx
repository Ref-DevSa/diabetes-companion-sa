import { Navigate, Outlet, useLocation } from 'react-router';
import { isSignedIn, useAuth } from './AuthContext';

export type LogInState = { from?: string; reason?: 'session_ended'; notice?: 'password_changed' };

/**
 * S8 to S11 are for Users only (BR16). A Visitor goes to S3 with "Log in to use this part of the app."
 * and returns to the wanted screen after logging in. An ended session shows its own banner on S3.
 */
export function RequireUser() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading) return null;
  if (!isSignedIn(auth)) {
    const state: LogInState = { from: location.pathname, ...(auth.sessionEnded ? { reason: 'session_ended' } : {}) };
    return <Navigate to="/log-in" replace state={state} />;
  }
  return <Outlet />;
}

/** S2, S3 and S4 are for Visitors; a User opening them goes to S1, or to the screen they wanted (BR16). */
export function RequireVisitor() {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.loading && isSignedIn(auth)) {
    const from = (location.state as LogInState | null)?.from;
    return <Navigate to={from ?? '/'} replace />;
  }
  return <Outlet />;
}
