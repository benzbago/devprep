import { BookOpen, CircleGauge, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const sampleStats = [
  { label: 'Sample quizzes', value: '3', icon: BookOpen },
  { label: 'Sample accuracy', value: '80%', icon: CircleGauge },
  { label: 'Sample study time', value: '45m', icon: Clock3 },
];

export function DashboardPage() {
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
          These numbers illustrate a future dashboard. Phase 1 does not save activity or
          create an account record.
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
      <div className="mt-8 rounded-2xl border border-white/8 bg-slate-950/45 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-white">Ready to explore the tutor?</h2>
        <p className="mt-2 max-w-2xl leading-7 text-slate-400">
          The public demo uses curated questions and answers and works without signing in.
        </p>
        <Link
          className="mt-5 inline-flex font-semibold text-indigo-300 hover:text-indigo-200"
          to="/tutor"
        >
          Open tutor demo →
        </Link>
      </div>
    </section>
  );
}
