import { render, screen } from '@testing-library/react';
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

describe('AuthPage', () => {
  it('keeps the public demo available when Supabase is not configured', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={unavailable}>
          <AuthPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getByText(unavailable.message!)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /continue with the public demo/i }),
    ).toHaveAttribute('href', '/tutor');
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });
});
