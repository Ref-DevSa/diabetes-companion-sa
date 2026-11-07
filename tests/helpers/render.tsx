import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import type { Session } from '@supabase/supabase-js';
import { AuthContext, type AuthState } from '../../src/auth/AuthContext';

export const fakeSession = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'thabo.test@example.co.za',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-10-03T08:00:00Z',
    last_sign_in_at: new Date().toISOString(),
  },
} as unknown as Session;

/** Shows the current path and router state so tests can check where a link went. */
function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location" data-state={JSON.stringify(location.state ?? null)}>
      {location.pathname}
    </output>
  );
}

type Route = string | { pathname: string; state?: unknown };
type Options = { route?: Route; auth?: Partial<AuthState> };

export function makeAuth(overrides: Partial<AuthState> = {}): AuthState {
  return {
    session: null,
    loading: false,
    error: false,
    retry: () => undefined,
    recovery: false,
    linkExpired: false,
    sessionEnded: false,
    clearNotices: () => undefined,
    ...overrides,
  };
}

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  return render(
    <AuthContext.Provider value={makeAuth(options.auth)}>
      <MemoryRouter initialEntries={[options.route ?? '/']}>
        {ui}
        <LocationProbe />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}
