import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/auth-context';
import { listQuizzes, type QuizSummary } from './quiz-service';

export function QuizListPage() {
  const auth = useAuth();
  const userId = auth.user?.id;

  if (auth.status === 'loading') return <Message title="Checking your session…" />;
  if (auth.status !== 'signedIn' || !userId) {
    return (
      <Message title="Sign in to take quizzes">
        <Link
          className="mt-6 inline-flex rounded-xl bg-indigo-400 px-5 py-3 font-semibold text-slate-950"
          to="/account"
        >
          Sign in
        </Link>
      </Message>
    );
  }

  return <QuizCatalog key={userId} />;
}

function QuizCatalog() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    void listQuizzes()
      .then((records) => {
        if (!active) return;
        setQuizzes(records);
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-300">
        Private learning record
      </p>
      <h1 className="mt-3 text-4xl font-bold text-white">JavaScript quizzes</h1>
      <p className="mt-4 max-w-2xl text-slate-400">
        Results are graded on the server and saved to your account.
      </p>
      {status === 'loading' ? (
        <p className="mt-8 text-slate-400">Loading quizzes…</p>
      ) : null}
      {status === 'error' ? (
        <p className="mt-8 text-red-200">Quizzes could not be loaded. Try again.</p>
      ) : null}
      {status === 'ready' && quizzes.length === 0 ? (
        <p className="mt-8 text-slate-400">No published quizzes are available.</p>
      ) : null}
      <div className="mt-8 grid gap-5">
        {quizzes.map((quiz) => (
          <article
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"
            key={`${quiz.id}-${quiz.version}`}
          >
            <p className="text-sm text-violet-300">{quiz.topic}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{quiz.title}</h2>
            <p className="mt-2 text-slate-400">{quiz.description}</p>
            <p className="mt-3 text-sm text-slate-500">
              {quiz.questionCount} questions · Version {quiz.version}
            </p>
            <Link
              className="mt-5 inline-flex rounded-xl bg-indigo-400 px-4 py-2 font-semibold text-slate-950"
              to={`/quizzes/${quiz.id}/${quiz.version}`}
            >
              Take quiz
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function Message({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      {children}
    </section>
  );
}
