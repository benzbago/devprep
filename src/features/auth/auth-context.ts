import type { User } from '@supabase/supabase-js';
import { createContext, useContext } from 'react';

type AuthResult =
  { ok: true; confirmationRequired?: boolean } | { ok: false; message: string };
type AuthStatus =
  'loading' | 'unavailable' | 'signedOut' | 'signedIn' | 'expired' | 'error';

export interface AuthState {
  status: AuthStatus;
  user?: User;
  message?: string;
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
}

const unavailableAction = (): Promise<AuthResult> =>
  Promise.resolve({ ok: false, message: 'Account features are unavailable.' });

export const AuthContext = createContext<AuthState>({
  status: 'loading',
  signIn: unavailableAction,
  signUp: unavailableAction,
  signOut: () => Promise.resolve(),
});

export function useAuth() {
  return useContext(AuthContext);
}
