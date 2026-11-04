import { CircleHelp, Lightbulb, RotateCcw, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { demoChallenges } from './demo-content';

export function TutorPage() {
  const [challengeId, setChallengeId] = useState(demoChallenges[0].id);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [hintCount, setHintCount] = useState(0);
  const [unsupported, setUnsupported] = useState(false);
  const challenge =
    demoChallenges.find(({ id }) => id === challengeId) ?? demoChallenges[0];
  const selectedQuestion = challenge.questions.find(
    ({ id }) => id === selectedQuestionId,
  );

  function resetConversation() {
    setSelectedQuestionId(null);
    setHintCount(0);
    setUnsupported(false);
  }

  function changeChallenge(id: string) {
    setChallengeId(id);
    resetConversation();
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div
            className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1.5 text-sm font-bold text-violet-200"
            role="status"
          >
            <Sparkles aria-hidden="true" size={16} /> Demo — predefined responses
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            JavaScript tutor demo
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-400">
            Choose a curated challenge and example question. This demo does not send your
            input to an AI service or analyze arbitrary code.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/12 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"
          onClick={resetConversation}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={16} /> Reset demo
        </button>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="space-y-5">
          <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-5">
            <label className="text-sm font-semibold text-slate-200" htmlFor="challenge">
              Challenge
            </label>
            <select
              className="mt-2 w-full rounded-xl border border-white/12 bg-slate-950 px-3 py-3 text-white"
              id="challenge"
              onChange={(event) => changeChallenge(event.target.value)}
              value={challenge.id}
            >
              {demoChallenges.map(({ id, title }) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
            <div className="mt-5 flex items-center justify-between">
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                {challenge.level}
              </span>
              <span className="text-xs text-slate-500">Curated example</span>
            </div>
            <h2 className="mt-5 text-xl font-semibold text-white">{challenge.title}</h2>
            <p className="mt-2 leading-7 text-slate-300">{challenge.prompt}</p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Goal: {challenge.objective}
            </p>
            <pre className="mt-5 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-300">
              <code>{challenge.code}</code>
            </pre>
          </div>

          <div className="rounded-2xl border border-indigo-400/15 bg-indigo-400/[0.055] p-5">
            <div className="flex items-center gap-2 text-indigo-200">
              <Lightbulb aria-hidden="true" size={18} />
              <h2 className="font-semibold">Progressive hints</h2>
            </div>
            <div aria-live="polite" className="mt-4 space-y-3">
              {challenge.hints.slice(0, hintCount).map((hint, index) => (
                <div
                  className="rounded-xl border border-white/8 bg-slate-950/50 p-4"
                  key={hint}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Hint {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{hint}</p>
                </div>
              ))}
            </div>
            {hintCount < 3 ? (
              <button
                className="mt-4 w-full rounded-xl bg-indigo-400 px-4 py-2.5 font-semibold text-slate-950 hover:bg-indigo-300"
                onClick={() => setHintCount((count) => Math.min(count + 1, 3))}
                type="button"
              >
                Show hint {hintCount + 1}
              </button>
            ) : (
              <p className="mt-4 text-sm text-indigo-200">
                All three predefined hints are visible.
              </p>
            )}
          </div>
        </aside>

        <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-5 sm:p-7">
          <div className="flex items-center gap-2">
            <CircleHelp aria-hidden="true" className="text-violet-300" size={20} />
            <h2 className="text-xl font-semibold text-white">
              Select an example question
            </h2>
          </div>
          <div className="mt-5 grid gap-3">
            {challenge.questions.map((question) => (
              <button
                className="rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-left font-medium text-slate-200 hover:border-violet-400/40 hover:bg-violet-400/[0.06]"
                key={question.id}
                onClick={() => {
                  setSelectedQuestionId(question.id);
                  setUnsupported(false);
                }}
                type="button"
              >
                {question.question}
              </button>
            ))}
            <button
              className="rounded-xl border border-dashed border-white/15 px-4 py-3 text-left text-sm text-slate-400 hover:border-white/30 hover:text-slate-200"
              onClick={() => {
                setUnsupported(true);
                setSelectedQuestionId(null);
              }}
              type="button"
            >
              I have a different question
            </button>
          </div>

          <div
            aria-live="polite"
            className="mt-6 min-h-44 rounded-2xl border border-white/8 bg-slate-950/65 p-5 sm:p-6"
          >
            {selectedQuestion ? (
              <>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-300">
                  Predefined tutor response
                </p>
                <h3 className="mt-3 font-semibold text-white">
                  {selectedQuestion.question}
                </h3>
                <p className="mt-3 leading-7 text-slate-300">{selectedQuestion.answer}</p>
              </>
            ) : unsupported ? (
              <>
                <p className="font-semibold text-amber-200">
                  Live AI is unavailable in this version.
                </p>
                <p className="mt-3 leading-7 text-slate-400">
                  This demo cannot analyze arbitrary questions or code. Choose one of the
                  predefined example questions to explore a curated response.
                </p>
              </>
            ) : (
              <p className="leading-7 text-slate-500">
                A curated response will appear here after you select one of the questions
                above.
              </p>
            )}
          </div>
          <p className="mt-4 text-sm text-slate-500">Demo — predefined responses</p>
        </div>
      </div>
    </section>
  );
}
