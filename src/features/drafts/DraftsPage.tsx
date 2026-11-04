import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { demoChallenges } from '../tutor-demo/demo-content';
import { useAuth } from '../auth/auth-context';
import {
  createDraft,
  deleteDraft,
  listDrafts,
  updateDraft,
  type CodeDraft,
} from './draft-service';
import { draftInputSchema, type DraftInput } from './draft-validation';
import { createRequestScope } from './request-scope';

const emptyDraft: DraftInput = {
  challengeId: demoChallenges[0]?.id ?? '',
  title: 'Untitled draft',
  code: demoChallenges[0]?.code ?? '',
};

export function DraftsPage() {
  const auth = useAuth();
  const userId = auth.user?.id;

  if (auth.status === 'loading') return <PageMessage title="Checking your session…" />;
  if (auth.status !== 'signedIn' || !userId) {
    return (
      <PageMessage title="Sign in to save drafts">
        <Link
          className="mt-6 inline-flex rounded-xl bg-indigo-400 px-5 py-3 font-semibold text-slate-950"
          to="/account"
        >
          Sign in
        </Link>
      </PageMessage>
    );
  }

  return <DraftWorkspace key={userId} signOut={() => auth.signOut()} userId={userId} />;
}

function DraftWorkspace({
  userId,
  signOut,
}: {
  userId: string;
  signOut: () => Promise<void>;
}) {
  const [drafts, setDrafts] = useState<CodeDraft[]>([]);
  const [editingId, setEditingId] = useState<string>();
  const [form, setForm] = useState<DraftInput>(emptyDraft);
  const [state, setState] = useState<'idle' | 'loading' | 'saving' | 'error'>('loading');
  const [message, setMessage] = useState<string>();
  const scope = useRef(createRequestScope());

  useEffect(() => {
    const currentScope = scope.current;
    currentScope.changeUser(userId);
    const request = currentScope.begin(userId);
    void listDrafts()
      .then((records) => {
        if (!request.isCurrent()) return;
        setDrafts(records);
        setState('idle');
      })
      .catch(() => {
        if (!request.isCurrent()) return;
        setState('error');
        setMessage('Drafts could not be loaded. Try again.');
      });
    return () => currentScope.changeUser(null);
  }, [userId]);

  async function save(event: FormEvent) {
    event.preventDefault();
    const parsed = draftInputSchema.safeParse(form);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message);
      setState('error');
      return;
    }
    const request = scope.current.begin(userId);
    setState('saving');
    setMessage(undefined);
    try {
      const saved = editingId
        ? await updateDraft(editingId, parsed.data)
        : await createDraft(userId, parsed.data);
      if (!request.isCurrent()) return;
      setDrafts((current) => [saved, ...current.filter(({ id }) => id !== saved.id)]);
      setEditingId(saved.id);
      setForm(parsed.data);
      setState('idle');
      setMessage('Draft saved. Not executed or verified.');
    } catch {
      if (!request.isCurrent()) return;
      setState('error');
      setMessage('Draft could not be saved. Try again.');
    }
  }

  async function remove() {
    if (!editingId) return;
    const request = scope.current.begin(userId);
    try {
      await deleteDraft(editingId);
      if (!request.isCurrent()) return;
      setDrafts((current) => current.filter(({ id }) => id !== editingId));
      setEditingId(undefined);
      setForm(emptyDraft);
      setMessage('Draft deleted.');
    } catch {
      if (request.isCurrent()) setMessage('Draft could not be deleted.');
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">
            Private workspace
          </p>
          <h1 className="mt-3 text-4xl font-bold text-white">Code drafts</h1>
          <p className="mt-3 text-slate-400">Not executed or verified.</p>
        </div>
        <div className="flex gap-3">
          <button
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold"
            onClick={() => {
              setEditingId(undefined);
              setForm(emptyDraft);
              setMessage(undefined);
            }}
            type="button"
          >
            New draft
          </button>
          <button
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-slate-300"
            onClick={() => void signOut()}
            type="button"
          >
            Sign out
          </button>
        </div>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <aside className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <h2 className="font-semibold text-white">Saved drafts</h2>
          {state === 'loading' ? (
            <p className="mt-4 text-slate-400">Loading drafts…</p>
          ) : null}
          {state !== 'loading' && drafts.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No saved drafts yet.</p>
          ) : null}
          <ul className="mt-4 space-y-2">
            {drafts.map((draft) => (
              <li key={draft.id}>
                <button
                  className="w-full rounded-xl border border-white/10 p-3 text-left hover:border-indigo-400/40"
                  onClick={() => {
                    setEditingId(draft.id);
                    setForm(draft);
                    setMessage(undefined);
                  }}
                  type="button"
                >
                  <span className="block font-semibold text-white">{draft.title}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Not executed or verified.
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <form
          className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-7"
          onSubmit={(event) => void save(event)}
        >
          <label className="block text-sm font-semibold">
            Challenge
            <select
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
              onChange={(e) => setForm({ ...form, challengeId: e.target.value })}
              value={form.challengeId}
            >
              {demoChallenges.map((challenge) => (
                <option key={challenge.id} value={challenge.id}>
                  {challenge.title}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-5 block text-sm font-semibold">
            Title
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
              maxLength={120}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              value={form.title}
            />
          </label>
          <label className="mt-5 block text-sm font-semibold">
            Code
            <textarea
              className="mt-2 min-h-80 w-full rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-sm"
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              spellCheck={false}
              value={form.code}
            />
          </label>
          <p className="mt-3 text-sm font-semibold text-amber-200">
            Not executed or verified.
          </p>
          {message ? (
            <p aria-live="polite" className="mt-3 text-sm text-slate-300">
              {message}
            </p>
          ) : null}
          <div className="mt-5 flex gap-3">
            <button
              className="rounded-xl bg-indigo-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
              disabled={state === 'saving'}
              type="submit"
            >
              {state === 'saving' ? 'Saving…' : 'Save draft'}
            </button>
            {editingId ? (
              <button
                className="rounded-xl border border-red-300/30 px-5 py-3 text-sm font-semibold text-red-200"
                onClick={() => void remove()}
                type="button"
              >
                Delete
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}

function PageMessage({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      {children}
    </section>
  );
}
