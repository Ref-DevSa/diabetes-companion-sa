// @vitest-environment jsdom
// T-BR16-2: the real app (real AuthProvider, real local Supabase) returns the User to the screen they wanted.
import '@testing-library/jest-dom/vitest';
import { afterAll, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import '../../src/i18n';
import { AppRoutes } from '../../src/App';
import { AuthProvider } from '../../src/auth/AuthProvider';
import { getSupabase } from '../../src/lib/supabase';
import { createUser, removeCreatedUsers } from '../helpers/supabaseTest';

afterAll(async () => {
  await getSupabase().auth.signOut({ scope: 'local' });
  await removeCreatedUsers();
});

function Where() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

describe('T-BR16-2: after logging in, the User lands on the screen they wanted', () => {
  it('T-BR16-2: a Visitor opening S9 logs in on S3 and arrives on S9', async () => {
    const user = await createUser('guard');
    const person = userEvent.setup();
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/checklist']}>
          <AppRoutes />
          <Where />
        </MemoryRouter>
      </AuthProvider>,
    );
    expect(await screen.findByText('Log in to use this part of the app.')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/log-in');

    await person.type(screen.getByLabelText('Email'), user.email);
    await person.type(screen.getByLabelText('Password'), user.password);
    await person.click(screen.getByRole('button', { name: 'Log in' }));

    await screen.findByRole('heading', { level: 1, name: 'Today' }, { timeout: 10_000 });
    expect(screen.getByTestId('location')).toHaveTextContent('/checklist');
  }, 20_000);
});
