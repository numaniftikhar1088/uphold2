import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from '../components/NotificationDropdown';

const MenuItem = ({ icon, label, to, onClick }) => {
  const inner = (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-800/60 hover:bg-slate-900/60 active:bg-slate-900 transition-colors duration-150">
      <div className="w-9 h-9 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
        {icon}
      </div>
      <span className="flex-1 text-sm text-white font-medium">{label}</span>
      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
  if (onClick) return <button className="w-full text-left" onClick={onClick}>{inner}</button>;
  return <Link to={to}>{inner}</Link>;
};

const kycBadgeStyle = {
  verified:      'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  pending:       'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  rejected:      'text-rose-400 border-rose-400/30 bg-rose-400/10',
  not_submitted: 'text-slate-400 border-slate-600 bg-slate-800',
};

const kycLabel = {
  verified:      'KYC Verified',
  pending:       'KYC Pending',
  rejected:      'KYC Rejected',
  not_submitted: 'KYC Not Submitted',
};

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState('');

  const referralLink = user?.referralCode
    ? `${window.location.origin}/register?ref=${user.referralCode}`
    : '';

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const badgeStyle = kycBadgeStyle[user?.kycStatus] ?? kycBadgeStyle.not_submitted;
  const badgeText  = kycLabel[user?.kycStatus]     ?? 'KYC Not Submitted';

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <button onClick={() => navigate(-1)} className="p-1 text-slate-400 hover:text-white transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-base font-semibold">Account</span>
        <NotificationDropdown />
      </div>

      {/* User info */}
      <div className="flex items-center justify-between px-6 py-6">
        <div>
          <h2 className="text-xl font-bold text-white">{user?.name}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={`px-2.5 py-0.5 text-xs border rounded-lg font-medium ${badgeStyle}`}>
              {badgeText}
            </span>
            {user?.role === 'admin' && (
              <span className="px-2.5 py-0.5 text-xs border border-violet-400/30 bg-violet-400/10 text-violet-400 rounded-lg font-medium">
                Admin
              </span>
            )}
          </div>
        </div>
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Balance card */}
      <div className="mx-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 mb-4 ring-1 ring-white/5 animate-fade-up">
        <p className="text-xs text-slate-500 uppercase tracking-wider">Available Balance</p>
        <p className="text-2xl font-bold text-white mt-1">${user?.balance?.toFixed(2)}</p>
        <div className="flex gap-2 mt-3">
          <Link to="/deposit" className="text-xs bg-cyan-500 text-slate-950 font-semibold px-3 py-1.5 rounded-xl">Deposit</Link>
          <Link to="/withdraw" className="text-xs bg-slate-700 text-white font-semibold px-3 py-1.5 rounded-xl">Withdraw</Link>
        </div>
      </div>

      {/* Referral card */}
      {user?.referralCode && (
        <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/20 px-5 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Referral Code</p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/60 px-4 py-3">
            <span className="font-mono text-xl font-bold text-white tracking-widest">{user.referralCode}</span>
            <button
              onClick={() => copyToClipboard(user.referralCode, 'code')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition shrink-0"
            >
              {copied === 'code' ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/40 border border-slate-700/40 px-4 py-2.5">
            <span className="text-[11px] text-slate-500 truncate font-mono">{referralLink}</span>
            <button
              onClick={() => copyToClipboard(referralLink, 'link')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 transition shrink-0"
            >
              {copied === 'link' ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <p className="text-[11px] text-slate-600">Share your link to invite others. They enter your code when signing up.</p>
        </div>
      )}

      <div className="border-t border-slate-800" />

      {/* Menu items */}
      <div className="mt-2">
        <MenuItem
          to="/profile/info"
          label="Personal Information"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <MenuItem
          to="/profile/payments"
          label="Payment Methods"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />
        <MenuItem
          to="/profile/security"
          label="Security"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />
        <MenuItem
          to="/kyc"
          label="KYC Verify"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
          }
        />
        <MenuItem
          to="/chat"
          label="Customer Support"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />
        {user?.role === 'admin' && (
          <MenuItem
            to="/admin"
            label="Admin Dashboard"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
        )}
      </div>

      {/* Sign out */}
      <div className="px-4 mt-8 pb-8">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-2xl py-4 text-white font-semibold text-base transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
