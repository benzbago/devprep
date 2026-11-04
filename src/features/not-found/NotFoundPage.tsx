import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">404</p>
      <h1 className="mt-4 text-4xl font-bold text-white">Page not found</h1>
      <p className="mt-4 text-lg text-slate-400">
        That route is not part of this learning path.
      </p>
      <Link
        className="mt-8 inline-flex rounded-xl bg-indigo-400 px-5 py-3 font-semibold text-slate-950 hover:bg-indigo-300"
        to="/"
      >
        Return home
      </Link>
    </section>
  );
}
