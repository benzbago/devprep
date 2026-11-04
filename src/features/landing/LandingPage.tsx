import { ArrowRight, BookOpenCheck, Lightbulb, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: Lightbulb,
    title: 'Progressive hints',
    copy: 'Move from a conceptual nudge to a detailed walkthrough at your own pace.',
  },
  {
    icon: BookOpenCheck,
    title: 'Curated practice',
    copy: 'Focus on practical JavaScript patterns chosen for beginner and intermediate learners.',
  },
  {
    icon: ShieldCheck,
    title: 'Honest demo',
    copy: 'Explore predefined tutor examples with no credentials, external AI, or hidden analysis.',
  },
];

export function LandingPage() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-indigo-400/25 bg-indigo-400/10 px-4 py-2 text-sm font-semibold text-indigo-200">
            Learn the reasoning, not just the answer
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
            Practice JavaScript with a clear path forward.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            DevPrep AI pairs trusted challenges with progressive hints and a transparent,
            predefined tutor demo—so you can focus on how solutions work.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-indigo-300"
              to="/tutor"
            >
              Try the tutor demo <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-xl border border-white/12 px-5 py-3 font-semibold text-white hover:bg-white/5"
              to="/dashboard"
            >
              View sample dashboard
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-indigo-950/30 sm:p-7">
          <div className="flex items-center justify-between border-b border-white/8 pb-4">
            <div>
              <p className="text-sm text-slate-400">Challenge preview</p>
              <p className="mt-1 font-semibold text-white">Count repeated values</p>
            </div>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              Beginner
            </span>
          </div>
          <pre className="mt-5 overflow-x-auto rounded-2xl bg-slate-950/80 p-5 text-sm leading-7 text-slate-300">
            <code>{`const values = ['a', 'b', 'a'];

// What structure lets you track
// each value as you visit it?`}</code>
          </pre>
          <div className="mt-4 rounded-2xl border border-violet-400/15 bg-violet-400/[0.06] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-300">
              Conceptual hint
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Think about a structure where each distinct value can become a key.
            </p>
          </div>
          <Link
            className="mt-4 inline-flex text-sm font-semibold text-indigo-300 hover:text-indigo-200"
            to="/challenges/frequency-counter"
          >
            Read the full challenge →
          </Link>
        </div>
      </section>
      <section className="border-y border-white/8 bg-white/[0.02]">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-14 sm:px-8 md:grid-cols-3">
          {features.map(({ icon: Icon, title, copy }) => (
            <article
              className="rounded-2xl border border-white/8 bg-slate-950/40 p-6"
              key={title}
            >
              <Icon aria-hidden="true" className="text-indigo-300" size={24} />
              <h2 className="mt-5 text-lg font-semibold text-white">{title}</h2>
              <p className="mt-2 leading-7 text-slate-400">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
