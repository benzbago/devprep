import { ArrowLeft, ArrowRight, Lightbulb } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { demoChallenges } from '../tutor-demo/demo-content';

export function ChallengePage() {
  const { challengeId } = useParams();
  const challenge = demoChallenges.find(({ id }) => id === challengeId);

  if (!challenge) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">
          Unknown challenge
        </p>
        <h1 className="mt-4 text-4xl font-bold text-white">Challenge not found</h1>
        <p className="mt-4 text-lg leading-8 text-slate-400">
          That challenge is not part of the curated Phase 1 catalog.
        </p>
        <Link
          className="mt-8 inline-flex rounded-xl bg-indigo-400 px-5 py-3 font-semibold text-slate-950 hover:bg-indigo-300"
          to="/tutor"
        >
          Open tutor demo
        </Link>
      </section>
    );
  }

  return (
    <article className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"
        to="/"
      >
        <ArrowLeft aria-hidden="true" size={16} /> Back home
      </Link>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
          {challenge.level}
        </span>
        <span className="text-sm text-slate-500">Curated JavaScript challenge</span>
      </div>
      <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
        {challenge.title}
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
        {challenge.prompt}
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-white/8 bg-white/[0.035] p-5 sm:p-7">
          <h2 className="text-lg font-semibold text-white">Starting point</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-5 text-sm leading-7 text-slate-300">
            <code>{challenge.code}</code>
          </pre>
          <h2 className="mt-7 text-lg font-semibold text-white">Learning objective</h2>
          <p className="mt-2 leading-7 text-slate-400">{challenge.objective}</p>
        </section>

        <aside className="rounded-2xl border border-indigo-400/15 bg-indigo-400/[0.055] p-5 sm:p-7">
          <div className="flex items-center gap-2 text-indigo-200">
            <Lightbulb aria-hidden="true" size={19} />
            <h2 className="font-semibold">Three hints available</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Open the tutor demo to reveal conceptual, directional, and detailed hints one
            at a time.
          </p>
          <ol className="mt-5 space-y-3 text-sm text-slate-300">
            <li>1. Conceptual guidance</li>
            <li>2. Algorithmic direction</li>
            <li>3. Detailed walkthrough</li>
          </ol>
          <Link
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-4 py-2.5 font-semibold text-slate-950 hover:bg-indigo-300"
            to="/tutor"
          >
            Explore in tutor <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </aside>
      </div>
    </article>
  );
}
