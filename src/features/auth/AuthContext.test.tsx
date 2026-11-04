import type { SupabaseClient, User } from '@supabase/supabase-js';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const authHarness = vi.hoisted(() => ({
  listener: undefined as
    ((event: string, session: { user: User } | null) => void) | undefined,
  unsubscribe: vi.fn(),
}));

vi.mock('./supabase-client', () => ({
  supabaseConfig: {
    available: true,
    url: 'http://127.0.0.1:54321',
    publishableKey: 'local-public-key',
  },
  supabase: {
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({
          data: { session: { user: { id: 'user-a' } as User } },
          error: null,
        }),
      ),
      onAuthStateChange: vi.fn(
        (listener: (event: string, session: { user: User } | null) => void) => {
          authHarness.listener = listener;
          return { data: { subscription: { unsubscribe: authHarness.unsubscribe } } };
        },
      ),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  } as unknown as SupabaseClient,
}));

import { useAuth } from './auth-context';
import { AuthProvider } from './AuthContext';

function AuthProbe() {
  const auth = useAuth();
  return <p>{`${auth.status}:${auth.user?.id ?? 'none'}`}</p>;
}

describe('AuthProvider', () => {
  it('updates the account and exposes an expired session without retaining the old user', async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText('signedIn:user-a')).toBeInTheDocument();

    act(() => authHarness.listener?.('SIGNED_IN', { user: { id: 'user-b' } as User }));
    expect(screen.getByText('signedIn:user-b')).toBeInTheDocument();

    act(() => authHarness.listener?.('SIGNED_OUT', null));
    expect(screen.getByText('expired:none')).toBeInTheDocument();
  });
});
