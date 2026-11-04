import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { useAuth } from './auth-context';

export function AuthPage() {
  const auth = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string>();

  if (auth.status === 'signedIn') return <Navigate replace to="/drafts" />;

  if (auth.status === 'unavailable') {
    return (
      <section className="mx-auto max-w-xl px-5 py-24 text-center sm:px-8">
        <h1 className="text-4xl font-bold text-white">Account features unavailable</h1>
        <p className="mt-5 leading-7 text-slate-300">{auth.message}</p>
        <p className="mt-3 text-sm text-slate-400">
          No credentials are needed for the public demo.
        </p>
        <Link
          className="mt-8 inline-flex rounded-xl bg-indigo-400 px-5 py-3 font-semibold text-slate-950"
          to="/tutor"
        >
          Continue with the public demo
        </Link>
      </section>
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setNotice(undefined);
    const result =
      mode === 'signIn'
        ? await auth.signIn(email, password)
        : await auth.signUp(email, password);
    setPending(false);
    if (!result.ok) setNotice(result.message);
    else if (result.confirmationRequired) {
      setNotice('Check your email to confirm your account, then return to sign in.');
      setMode('signIn');
    }
  }

  return (
    <section className="mx-auto max-w-xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">
        Optional account
      </p>
      <h1 className="mt-4 text-4xl font-bold text-white">
        {mode === 'signIn' ? 'Sign in' : 'Create an account'}
      </h1>
      <p className="mt-4 leading-7 text-slate-400">
        Save private code drafts. Your code is never run or checked.
      </p>
      <form
        className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-white/[0.035] p-6"
        onSubmit={(event) => void submit(event)}
      >
        <label className="block text-sm font-semibold text-slate-200">
          Email
          <input
            autoComplete="email"
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-200">
          Password
          <input
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {notice || auth.status === 'expired' || auth.status === 'error' ? (
          <p aria-live="polite" className="text-sm text-amber-200">
            {notice ?? auth.message}
          </p>
        ) : null}
        <button
          className="w-full rounded-xl bg-indigo-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
          disabled={pending || auth.status === 'loading'}
          type="submit"
        >
          {pending ? 'Please wait…' : mode === 'signIn' ? 'Sign in' : 'Create account'}
        </button>
      </form>
      <button
        className="mt-5 text-sm font-semibold text-indigo-300 hover:text-indigo-200"
        onClick={() => {
          setMode(mode === 'signIn' ? 'signUp' : 'signIn');
          setNotice(undefined);
        }}
        type="button"
      >
        {mode === 'signIn'
          ? 'Need an account? Create one'
          : 'Already have an account? Sign in'}
      </button>
    </section>
  );
}
