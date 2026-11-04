import type { User } from '@supabase/supabase-js';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { supabase, supabaseConfig } from './supabase-client';
import { AuthContext, type AuthState } from './auth-context';

type AuthStatus = AuthState['status'];
const unavailableAction = () =>
  Promise.resolve({ ok: false as const, message: 'Account features are unavailable.' });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(
    supabaseConfig.available ? 'loading' : 'unavailable',
  );
  const [user, setUser] = useState<User>();
  const [message, setMessage] = useState(
    supabaseConfig.available ? undefined : supabaseConfig.reason,
  );

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setStatus('error');
        setMessage('We could not check your session. Try again.');
        return;
      }
      setUser(data.session?.user);
      setStatus(data.session ? 'signedIn' : 'signedOut');
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setUser(session?.user);
      if (session) {
        setStatus('signedIn');
        setMessage(undefined);
      } else if (event === 'SIGNED_OUT') {
        setStatus((previous) => (previous === 'signedIn' ? 'expired' : 'signedOut'));
        setMessage((previous) => previous ?? 'Your session ended. Sign in again.');
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      status,
      user,
      message,
      async signIn(email, password) {
        if (!supabase) return unavailableAction();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? { ok: false, message: error.message } : { ok: true };
      },
      async signUp(email, password) {
        if (!supabase) return unavailableAction();
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return { ok: false, message: error.message };
        return { ok: true, confirmationRequired: !data.session };
      },
      async signOut() {
        if (!supabase) return;
        setUser(undefined);
        setStatus('signedOut');
        setMessage(undefined);
        await supabase.auth.signOut();
      },
    }),
    [message, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
