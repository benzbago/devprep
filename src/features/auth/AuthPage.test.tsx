import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AuthContext, type AuthState } from './auth-context';
import { AuthPage } from './AuthPage';

const unavailable: AuthState = {
  status: 'unavailable',
  message: 'Account features are unavailable because Supabase is not configured.',
  signIn: () => Promise.resolve({ ok: false, message: 'Unavailable' }),
  signUp: () => Promise.resolve({ ok: false, message: 'Unavailable' }),
  signOut: () => Promise.resolve(),
};

const signedOut: AuthState = {
  ...unavailable,
  status: 'signedOut',
  message: undefined,
};

function renderPage(auth: AuthState, signupEnabled?: boolean) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={auth}>
        <AuthPage signupEnabled={signupEnabled} />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('AuthPage', () => {
  it('keeps the public demo available when Supabase is not configured', () => {
    renderPage(unavailable);

    expect(screen.getByText(unavailable.message!)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /continue with the public demo/i }),
    ).toHaveAttribute('href', '/tutor');
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('defaults to sign-in only without claiming that Auth registration is disabled', () => {
    renderPage(signedOut);

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    expect(
      screen.getByText(/account creation is not offered on this page/i),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /need an account/i }),
    ).not.toBeInTheDocument();
  });

  it('offers account creation only when local signup is explicitly enabled', async () => {
    const user = userEvent.setup();
    renderPage(signedOut, true);

    await user.click(screen.getByRole('button', { name: /need an account/i }));

    expect(screen.getByRole('heading', { name: /create an account/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /create account/i })).toBeVisible();
  });
});
