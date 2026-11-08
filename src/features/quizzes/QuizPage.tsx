import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import type { GradedAttempt } from '../../../shared/quiz-contract';
import { useAuth } from '../auth/auth-context';
import {
  getQuizQuestions,
  submitQuiz,
  type QuizQuestion,
  type QuizSummary,
} from './quiz-service';

export function QuizRoutePage() {
  const { quizId = '', quizVersion = '' } = useParams();
  return <QuizPage quizId={quizId} quizVersion={Number(quizVersion)} />;
}

export function QuizPage({
  quizId,
  quizVersion,
}: {
  quizId: string;
  quizVersion: number;
}) {
  const auth = useAuth();
  const userId = auth.user?.id;
  if (auth.status === 'loading') return <PageMessage title="Checking your session…" />;
  if (auth.status !== 'signedIn' || !userId)
    return (
      <PageMessage title="Sign in to take this quiz">
        <Link className="mt-6 inline-flex text-indigo-300" to="/account">
          Sign in
        </Link>
      </PageMessage>
    );
  return (
    <QuizWorkspace
      key={`${userId}-${quizId}-${quizVersion}`}
      quizId={quizId}
      quizVersion={quizVersion}
    />
  );
}

function QuizWorkspace({ quizId, quizVersion }: { quizId: string; quizVersion: number }) {
  const [quiz, setQuiz] = useState<QuizSummary>();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState<string>();
  const [attempt, setAttempt] = useState<GradedAttempt>();
  const [submissionId, setSubmissionId] = useState<string>();
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  function startNewAttempt() {
    setAnswers({});
    setAttempt(undefined);
    setSubmissionId(undefined);
    setMessage(undefined);
    setStatus('ready');
  }

  useEffect(() => {
    let active = true;
    void getQuizQuestions(quizId, quizVersion)
      .then((result) => {
        if (!active) return;
        setQuiz(result.quiz);
        setQuestions(result.questions);
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
        setMessage('This quiz could not be loaded. It may no longer be available.');
      });
    return () => {
      active = false;
    };
  }, [quizId, quizVersion]);

  useEffect(() => {
    if (attempt) resultHeadingRef.current?.focus();
  }, [attempt]);

  async function grade() {
    const retryId = submissionId ?? crypto.randomUUID();
    setSubmissionId(retryId);
    setStatus('submitting');
    setMessage(undefined);
    try {
      const result = await submitQuiz({
        quizId,
        quizVersion,
        submissionId: retryId,
        answers: questions.map((question) => ({
          questionId: question.id,
          optionIndex: answers[question.id] ?? -1,
        })),
      });
      setAttempt(result);
      setStatus('ready');
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setMessage(
        code === 'INVALID_OR_EXPIRED_SESSION'
          ? 'Your session ended. Sign in again.'
          : code === 'RATE_LIMITED'
            ? 'Too many submissions. Wait a minute and try again.'
            : code === 'IDEMPOTENCY_CONFLICT'
              ? 'This retry no longer matches the original submission. Start a new attempt.'
              : 'The quiz could not be graded. Try again.',
      );
      setStatus('error');
    }
  }

  if (status === 'loading') return <PageMessage title="Loading quiz…" />;

  return (
    <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-300">
        Server-graded quiz · Version {quizVersion}
      </p>
      <h1 className="mt-3 text-4xl font-bold text-white">
        {quiz?.title ?? 'Quiz unavailable'}
      </h1>
      {message ? (
        <div className="mt-5 rounded-xl border border-red-300/20 bg-red-300/[0.06] p-4 text-red-100">
          <p role="alert">{message}</p>
          {submissionId ? (
            <button
              className="mt-3 rounded-lg border border-red-100/20 px-3 py-2 font-semibold"
              onClick={startNewAttempt}
              type="button"
            >
              Start a new attempt
            </button>
          ) : null}
        </div>
      ) : null}
      {attempt ? (
        <div className="mt-8 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-6">
          <h2
            className="text-5xl font-bold text-white"
            ref={resultHeadingRef}
            tabIndex={-1}
          >
            {attempt.scorePercent}%
          </h2>
          <p className="mt-2 text-emerald-100">
            {attempt.correctCount} of {attempt.questionCount} correct — authoritatively
            graded and saved.
          </p>
          <button
            className="mt-5 rounded-xl border border-white/15 px-4 py-2 font-semibold"
            onClick={startNewAttempt}
            type="button"
          >
            Start a new attempt
          </button>
        </div>
      ) : (
        <form
          className="mt-8 space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            void grade();
          }}
        >
          {questions.map((question) => (
            <fieldset
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"
              key={question.id}
            >
              <legend className="px-2 font-semibold text-white">
                {question.position}. {question.prompt}
              </legend>
              <div className="mt-4 grid gap-3">
                {question.options.map((option, optionIndex) => (
                  <label
                    className="flex cursor-pointer gap-3 rounded-xl border border-white/10 p-3 text-slate-300"
                    key={option}
                  >
                    <input
                      checked={answers[question.id] === optionIndex}
                      name={question.id}
                      onChange={() => {
                        if (submissionId) {
                          setSubmissionId(undefined);
                          setMessage(undefined);
                          setStatus('ready');
                        }
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: optionIndex,
                        }));
                      }}
                      type="radio"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <button
            className="rounded-xl bg-indigo-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-950"
            disabled={
              status === 'submitting' ||
              questions.length === 0 ||
              Object.keys(answers).length !== questions.length
            }
            type="submit"
          >
            {status === 'submitting' ? 'Submitting…' : 'Submit quiz'}
          </button>
        </form>
      )}
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
