import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { BrandMark } from './BrandMark';

const destinations = [
  { to: '/', label: 'Home' },
  { to: '/tutor', label: 'Tutor demo' },
  { to: '/sample-quiz', label: 'Sample quiz' },
  { to: '/quizzes', label: 'Quizzes' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/drafts', label: 'Drafts' },
  { to: '/account', label: 'Account' },
];

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  return destinations.map(({ to, label }) => (
    <NavLink
      className={({ isActive }) =>
        `rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive
            ? 'bg-indigo-400/15 text-indigo-200'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`
      }
      end={to === '/'}
      key={to}
      onClick={onNavigate}
      to={to}
    >
      {label}
    </NavLink>
  ));
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070b16] text-slate-100">
      <a
        className="fixed left-4 top-3 z-50 -translate-y-24 rounded-lg bg-indigo-300 px-4 py-2 font-semibold text-slate-950 transition focus:translate-y-0"
        href="#main-content"
      >
        Skip to main content
      </a>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -left-28 -top-24 size-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -right-40 top-1/3 size-[30rem] rounded-full bg-violet-600/10 blur-3xl" />
      </div>
      <header className="relative z-20 border-b border-white/8 bg-[#070b16]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <BrandMark />
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-1 md:flex"
          >
            <NavigationLinks />
          </nav>
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            className="grid size-11 place-items-center rounded-xl border border-white/10 text-slate-200 hover:border-indigo-400/40 hover:bg-white/5 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
        {menuOpen ? (
          <nav
            aria-label="Mobile navigation"
            className="mx-5 mb-4 grid gap-1 rounded-2xl border border-white/10 bg-slate-950/90 p-3 md:hidden"
            key={location.pathname}
          >
            <NavigationLinks onNavigate={() => setMenuOpen(false)} />
          </nav>
        ) : null}
      </header>
      <main className="relative z-10" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="relative z-10 border-t border-white/8 px-5 py-8 text-center text-sm text-slate-500">
        <p>Built as a zero-spend learning project. Demo content is predefined.</p>
      </footer>
    </div>
  );
}
