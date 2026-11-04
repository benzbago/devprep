import { Braces } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BrandMark() {
  return (
    <Link
      className="group inline-flex items-center gap-3 font-semibold text-white"
      to="/"
    >
      <span className="grid size-10 place-items-center rounded-xl border border-indigo-400/30 bg-indigo-400/10 text-indigo-300 shadow-lg shadow-indigo-950/40 transition group-hover:border-indigo-300/60">
        <Braces aria-hidden="true" size={21} />
      </span>
      <span className="text-lg tracking-tight">DevPrep AI</span>
    </Link>
  );
}
