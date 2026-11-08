import { useEffect, useRef, useState } from 'react';

import { publicSampleQuiz } from '../../data/public-demo/sample-quiz';

export function PublicSampleQuizPage() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number>();
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (score !== undefined) resultHeadingRef.current?.focus();
  }, [score]);

  function gradeSample() {
    const correct = publicSampleQuiz.questions.filter(
      (question) => answers[question.id] === question.correctOption,
    ).length;
    setScore(Math.round((correct / publicSampleQuiz.questions.length) * 100));
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-200">
        Public sample — answers may be inspectable
      </p>
      <h1 className="mt-3 text-4xl font-bold text-white">{publicSampleQuiz.title}</h1>
      <p className="mt-4 text-slate-400">
        This sample is graded only in your browser and is not saved to your account
        progress.
      </p>
      <form
        className="mt-8 space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          gradeSample();
        }}
      >
        {publicSampleQuiz.questions.map((question, questionIndex) => (
          <fieldset
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"
            key={question.id}
          >
            <legend className="px-2 font-semibold text-white">
              {questionIndex + 1}. {question.prompt}
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
                    onChange={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: optionIndex,
                      }))
                    }
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
          disabled={Object.keys(answers).length !== publicSampleQuiz.questions.length}
          type="submit"
        >
          Check sample answers
        </button>
      </form>
      {score !== undefined ? (
        <div className="mt-8 rounded-2xl border border-amber-300/20 p-6">
          <h2
            className="text-4xl font-bold text-white"
            ref={resultHeadingRef}
            tabIndex={-1}
          >
            {score}%
          </h2>
          <p className="mt-2 text-slate-400">
            Local sample result only. Nothing was saved.
          </p>
        </div>
      ) : null}
    </section>
  );
}
