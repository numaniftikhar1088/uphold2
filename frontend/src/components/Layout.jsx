import React, { useId } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from '../components/NotificationDropdown';

/* ── UPhold SVG Logo ─────────────────────────────────────────────────────── */
const UpholdLogo = ({ size = 36 }) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="17" fill={`url(#lg${uid})`} />
      {/* Left arm of U */}
      <path d="M11 25V15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      {/* Bottom curve of U */}
      <path d="M11 25C11 27.8 14.1 29 18 29C21.9 29 25 27.8 25 25"
        stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Right arm — taller, becomes an upward arrow */}
      <path d="M25 25V10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      {/* Arrow head */}
      <path d="M22 13.5L25 10L28 13.5"
        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <defs>
        <linearGradient id={`lg${uid}`} x1="1" y1="1" x2="35" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
    </svg>
  );
};

/* ── Bottom Mobile Navigation ────────────────────────────────────────────── */
const BottomNav = () => {
  const location = useLocation();
  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const items = [
    {
      to: '/',
      label: 'Home',
      icon: (active) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
          stroke={active ? 'none' : 'currentColor'} strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: '/spot',
      label: 'Spot',
      icon: (active) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          {/* Buy/sell swap arrows */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L4 7m3-3l3 3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8v12m0 0l3-3m-3 3l-3-3" />
        </svg>
      ),
    },
    {
      to: '/derivatives',
      label: 'Deriv.',
      icon: (active) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          {/* Candlestick bars */}
          <rect x="4" y="8" width="3" height="7" rx="0.5"
            fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" />
          <line x1="5.5" y1="4"  x2="5.5" y2="8"  strokeLinecap="round" />
          <line x1="5.5" y1="15" x2="5.5" y2="19" strokeLinecap="round" />
          <rect x="10.5" y="5" width="3" height="6" rx="0.5"
            fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" />
          <line x1="12" y1="2"  x2="12" y2="5"  strokeLinecap="round" />
          <line x1="12" y1="11" x2="12" y2="14" strokeLinecap="round" />
          <rect x="17" y="10" width="3" height="5" rx="0.5"
            fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" />
          <line x1="18.5" y1="7"  x2="18.5" y2="10" strokeLinecap="round" />
          <line x1="18.5" y1="15" x2="18.5" y2="18" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      to: '/deposit',
      label: 'Deposit',
      icon: (active) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          {/* Down arrow into tray (money coming in) */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v9M8 9l4 4 4-4M4 19h16" />
        </svg>
      ),
    },
    {
      to: '/withdraw',
      label: 'Withdraw',
      icon: (active) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V11m0 0l-4 4m4-4l4 4M4 5h16" />
        </svg>
      ),
    },
    {
      to: '/profile',
      label: 'Account',
      icon: (active) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
          stroke={active ? 'none' : 'currentColor'} strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#070B12]/96 border-t border-slate-800/60 backdrop-blur-xl">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all hover:scale-110 ${
                active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {item.icon(active)}
              <span className={`text-[10px] font-semibold ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

/* ── Main Layout ─────────────────────────────────────────────────────────── */
const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100">

      {/* Desktop header */}
      <header className="hidden md:block border-b border-slate-800/60 bg-[#070B12]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="animate-logo-glow">
              <UpholdLogo size={48} />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white group-hover:text-emerald-300 transition block">
                UPhold
              </span>
              <p className="text-xs text-slate-500 mt-0.5">Trading · Markets · Wallet</p>
            </div>
          </Link>

          {/* Nav + actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
            <nav className="flex flex-wrap gap-1.5">
              <Link to="/profile"
                className="rounded-xl bg-slate-800/50 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700/60 hover:text-white hover:scale-105 inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account
              </Link>
              <Link to="/spot"
                className="rounded-xl bg-slate-800/50 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-green-500/20 hover:text-green-300 hover:scale-105">
                Spot
              </Link>
              <Link to="/derivatives"
                className="rounded-xl bg-slate-800/50 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-cyan-500/20 hover:text-cyan-300 hover:scale-105">
                Derivatives
              </Link>
              <Link to="/deposit"
                className="rounded-xl bg-slate-800/50 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-emerald-500/20 hover:text-emerald-300 hover:scale-105 inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v9M8 9l4 4 4-4M4 19h16" />
                </svg>
                Deposit
              </Link>
              <Link to="/withdraw"
                className="rounded-xl bg-slate-800/50 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-amber-500/20 hover:text-amber-300 hover:scale-105 inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V11m0 0l-4 4m4-4l4 4M4 5h16" />
                </svg>
                Withdraw
              </Link>

              <Link to="/chat"
                className="rounded-xl bg-slate-800/50 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-violet-500/20 hover:text-violet-300 hover:scale-105 inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Support
              </Link>
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin"
                    className="rounded-xl bg-slate-800/50 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-violet-500/20 hover:text-violet-300 hover:scale-105">
                    Admin
                  </Link>
                  <Link to="/admin/trades"
                    className="rounded-xl bg-amber-500/20 border border-amber-500/30 px-3.5 py-2 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/30 hover:scale-105">
                    Pending Trades
                  </Link>
                </>
              )}
            </nav>

            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <button
                onClick={handleLogout}
                className="rounded-xl bg-slate-800/60 border border-slate-700/50 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white hover:scale-105 inline-flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 text-red-400 animate-logout-glow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-2.5 bg-[#070B12]/95 backdrop-blur-xl border-b border-slate-800/60">
        <Link to="/" className="flex items-center gap-2">
          <div className="animate-logo-glow">
            <UpholdLogo size={30} />
          </div>
          <span className="text-lg font-black tracking-tight text-white">UPhold</span>
        </Link>
        <NotificationDropdown />
      </header>

      <main className="w-full">
        <div key={location.pathname} className="pb-20 md:pb-0 animate-fade-up">
          {children}
        </div>
      </main>

      {/* Desktop footer */}
      <footer className="hidden md:block border-t border-slate-800/60 bg-[#070B12]/90 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <UpholdLogo size={20} />
            <p className="text-sm text-slate-500">© 2026 UPhold. Built for modern crypto traders.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <Link to="/chat"    className="transition hover:text-slate-300">Support</Link>
            <Link to="/privacy" className="transition hover:text-slate-300">Privacy</Link>
          </div>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
};

export default Layout;