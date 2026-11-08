import { BookOpen, CircleGauge, History } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/auth-context';
import {
  listAttempts,
  listRecommendationAttempts,
  type QuizAttempt,
} from '../quizzes/attempt-service';
import { listQuizVersions } from '../quizzes/quiz-service';
import { RecommendationPanel } from '../recommendations/RecommendationPanel';
import {
  deriveStudyRecommendations,
  type RecommendationResult,
} from '../recommendations/recommendation-engine';

const sampleStats = [
  { label: 'Sample quizzes', value: '3', icon: BookOpen },
  { label: 'Sample accuracy', value: '80%', icon: CircleGauge },
  { label: 'Sample study time', value: '45m', icon: History },
];

export function DashboardPage() {
  const auth = useAuth();
  const userId = auth.user?.id;

  if (auth.status === 'signedIn' && userId) {
    return <AuthenticatedDashboard key={userId} />;
  }

  return <SampleDashboard />;
}

function AuthenticatedDashboard() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [recommendation, setRecommendation] = useState<RecommendationResult>();
  const [recommendationStatus, setRecommendationStatus] = useState<
    'loading' | 'ready' | 'error'
  >('loading');

  useEffect(() => {
    let active = true;
    void listAttempts()
      .then((records) => {
        if (!active) return;
        setAttempts(records);
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    void Promise.all([listRecommendationAttempts(), listQuizVersions()])
      .then(([evidence, quizzes]) => {
        if (!active) return;
        setRecommendation(deriveStudyRecommendations(evidence, quizzes));
        setRecommendationStatus('ready');
      })
      .catch(() => {
        if (active) setRecommendationStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  const latest = attempts[0];
  const best = attempts.reduce(
    (highest, attempt) => Math.max(highest, attempt.scorePercent),
    0,
  );
  const uniqueQuizzes = new Set(
    attempts.map(({ quizId, quizVersion }) => `${quizId}:${quizVersion}`),
  ).size;

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-300">
        Your saved activity
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
        Learning dashboard
      </h1>
      <p className="mt-4 text-slate-400">
        Every figure below comes from your server-graded quiz attempts.
      </p>
      {status === 'loading' ? (
        <p className="mt-8 text-slate-400">Loading progress…</p>
      ) : null}
      {status === 'error' ? (
        <p className="mt-8 text-red-200">Progress could not be loaded. Try again.</p>
      ) : null}
      {status === 'ready' && attempts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-white/10 p-6">
          <p className="font-semibold text-white">No graded attempts yet.</p>
          <Link className="mt-4 inline-flex text-indigo-300" to="/quizzes">
            Take an authenticated quiz →
          </Link>
        </div>
      ) : null}
      {attempts.length > 0 ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Stat label="Total attempts" value={String(attempts.length)} />
            <Stat label="Best score" value={`${best}%`} />
            <Stat label="Latest score" value={`${latest?.scorePercent ?? 0}%`} />
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Published quiz versions attempted: {uniqueQuizzes}
          </p>
          <h2 className="mt-10 text-xl font-semibold text-white">Attempt history</h2>
          <ul className="mt-4 space-y-3">
            {attempts.map((attempt) => (
              <li
                className="rounded-xl border border-white/10 p-4 text-slate-300"
                key={attempt.id}
              >
                <span className="font-semibold text-white">{attempt.quizId}</span> ·
                Version {attempt.quizVersion} · {attempt.scorePercent}%
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {recommendationStatus === 'loading' ? (
        <p aria-live="polite" className="mt-10 text-slate-400">
          Loading study recommendations…
        </p>
      ) : null}
      {recommendationStatus === 'error' ? (
        <p role="alert" className="mt-10 text-red-200">
          Study recommendations could not be loaded. Your attempt history is still
          available above.
        </p>
      ) : null}
      {recommendationStatus === 'ready' && recommendation ? (
        <RecommendationPanel result={recommendation} />
      ) : null}
    </section>
  );
}

function SampleDashboard() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-300">
        Preview
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
        Sample learning dashboard
      </h1>
      <div className="mt-5 max-w-3xl rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-amber-100">
        <p className="font-semibold">Sample content only</p>
        <p className="mt-1 text-sm leading-6 text-amber-100/75">
          Sign in to see figures derived only from your real graded quiz attempts.
        </p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {sampleStats.map(({ label, value, icon: Icon }) => (
          <article
            className="rounded-2xl border border-white/8 bg-white/[0.035] p-6"
            key={label}
          >
            <Icon aria-hidden="true" className="text-violet-300" size={22} />
            <p className="mt-5 text-3xl font-bold text-white">{value}</p>
            <p className="mt-1 text-sm text-slate-400">{label}</p>
          </article>
        ))}
      </div>
      <Link className="mt-8 inline-flex font-semibold text-indigo-300" to="/sample-quiz">
        Try the public sample quiz →
      </Link>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-white/8 bg-white/[0.035] p-6">
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </article>
  );
}
