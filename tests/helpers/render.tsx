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

type Options = { route?: string; auth?: Partial<AuthState> };

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const auth: AuthState = {
    session: null,
    loading: false,
    error: false,
    retry: () => undefined,
    ...options.auth,
  };
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[options.route ?? '/']}>
        {ui}
        <LocationProbe />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}
