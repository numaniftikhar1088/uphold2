import { useId } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const UpholdLogo = ({ size = 32 }) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="17" fill={`url(#lg${uid})`} />
      <path d="M11 25V15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M11 25C11 27.8 14.1 29 18 29C21.9 29 25 27.8 25 25" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M25 25V10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 13.5L25 10L28 13.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <defs>
        <linearGradient id={`lg${uid}`} x1="1" y1="1" x2="35" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const NAV = [
  {
    to: '/admin',
    exact: true,
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/admin/withdraw',
    label: 'Withdraw',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V11m0 0l-4 4m4-4l4 4M4 5h16" />
      </svg>
    ),
  },
  {
    to: '/admin/deposit',
    label: 'Deposit',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v9M8 9l4 4 4-4M4 19h16" />
      </svg>
    ),
  },
  {
    to: '/admin/support',
    label: 'Support',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    to: '/admin/trades',
    label: 'Pending Trades',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    to: '/admin/kyc',
    label: 'KYC',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c0 1.105.895 2 2 2s2-.895 2-2" />
      </svg>
    ),
  },
  {
    to: '/admin/account',
    label: 'Account',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A8.966 8.966 0 0112 15c2.21 0 4.232.8 5.879 2.118M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (to, exact) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 md:flex">

      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen border-r border-slate-800/60 bg-[#0D1421] sticky top-0 shrink-0">
        {/* Brand */}
        <div className="px-4 py-4 border-b border-slate-800/60">
          <div className="flex items-center justify-between gap-2">
            <Link to="/admin" className="flex items-center gap-2.5 hover:opacity-80 transition min-w-0">
              <UpholdLogo size={32} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white leading-tight">UPhold</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </Link>
            <NotificationDropdown />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 py-3 border-t border-slate-800/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition border border-transparent"
          >
            <svg className="w-5 h-5 text-red-400 animate-logout-glow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile header ───────────────────────────────── */}
      <div className="md:hidden flex flex-col flex-1">
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#0D1421] border-b border-slate-800/60">
          <Link to="/admin" className="flex items-center gap-2 hover:opacity-80 transition">
            <UpholdLogo size={28} />
            <span className="text-sm font-bold text-white">UPhold</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-red-400 transition px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40 inline-flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-red-400 animate-logout-glow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 pb-20"><div key={location.pathname} className="animate-fade-up">{children}</div></main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D1421]/96 border-t border-slate-800/60 backdrop-blur-xl">
          <div className="flex items-center justify-around py-1.5">
            {NAV.map((item) => {
              const active = isActive(item.to, item.exact);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl transition-all ${
                    active ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {item.icon}
                  <span className={`text-[9px] font-semibold leading-tight text-center ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {item.label === 'Pending Trades' ? 'Trades' : item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ── Desktop main content ─────────────────────────── */}
      <main className="hidden md:block flex-1 overflow-auto"><div key={location.pathname} className="animate-fade-up">{children}</div></main>
    </div>
  );
};

export default AdminLayout;
