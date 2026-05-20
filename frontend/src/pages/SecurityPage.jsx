import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import NotificationDropdown from '../components/NotificationDropdown';

const SecurityPage = () => {
  const navigate = useNavigate();

  const [pwForm, setPwForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [txForm, setTxForm]   = useState({ currentPassword: '', newTransactionPassword: '', confirmTransactionPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwOk,    setPwOk]    = useState('');
  const [txError, setTxError] = useState('');
  const [txOk,    setTxOk]    = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);

  /* ── Change login password ── */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError(''); setPwOk('');
    if (pwForm.newPassword.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('New passwords do not match.'); return; }
    setPwLoading(true);
    try {
      const { data } = await api.put('/auth/me/password', {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      setPwOk(data.message);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err?.response?.data?.message || 'Failed to update password.');
    } finally {
      setPwLoading(false);
    }
  };

  /* ── Change transaction password ── */
  const handleTxSubmit = async (e) => {
    e.preventDefault();
    setTxError(''); setTxOk('');
    if (txForm.newTransactionPassword.length < 4) { setTxError('New transaction password must be at least 4 characters.'); return; }
    if (txForm.newTransactionPassword !== txForm.confirmTransactionPassword) { setTxError('New transaction passwords do not match.'); return; }
    setTxLoading(true);
    try {
      const { data } = await api.put('/auth/me/transaction-password', {
        currentPassword:      txForm.currentPassword,
        newTransactionPassword: txForm.newTransactionPassword,
      });
      setTxOk(data.message);
      setTxForm({ currentPassword: '', newTransactionPassword: '', confirmTransactionPassword: '' });
    } catch (err) {
      setTxError(err?.response?.data?.message || 'Failed to update transaction password.');
    } finally {
      setTxLoading(false);
    }
  };

  const inputClass = 'w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald-500 placeholder-slate-600 transition';

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <button onClick={() => navigate(-1)} className="p-1 text-slate-400 hover:text-white transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-base font-semibold">Security</span>
        <NotificationDropdown />
      </div>

      <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">

        {/* ── Section 1: User Password ── */}
        <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/60">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">User Password</p>
              <p className="text-xs text-slate-500">Used to log in to your account</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="p-5 space-y-3">
            {pwError && <div className="rounded-xl bg-red-500/10 px-3 py-2.5 text-xs text-red-400">{pwError}</div>}
            {pwOk    && <div className="rounded-xl bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400">{pwOk}</div>}

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Current Password</label>
              <input
                type="password" value={pwForm.currentPassword} required
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                placeholder="Enter your current password"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">New Password</label>
              <input
                type="password" value={pwForm.newPassword} required minLength={6}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                placeholder="Min 6 characters"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Confirm New Password</label>
              <input
                type="password" value={pwForm.confirmPassword} required
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                placeholder="Repeat new password"
                className={inputClass}
              />
            </div>

            <button
              type="submit" disabled={pwLoading}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition mt-1"
            >
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* ── Section 2: Transaction Password ── */}
        <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/60">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Transaction Password</p>
              <p className="text-xs text-slate-500">Used to authorize deposits, withdrawals &amp; payment methods</p>
            </div>
          </div>

          <form onSubmit={handleTxSubmit} className="p-5 space-y-3">
            {txError && <div className="rounded-xl bg-red-500/10 px-3 py-2.5 text-xs text-red-400">{txError}</div>}
            {txOk    && <div className="rounded-xl bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400">{txOk}</div>}

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Login Password <span className="text-slate-600 font-normal">(account password, not transaction password)</span></label>
              <input
                type="password" value={txForm.currentPassword} required
                onChange={(e) => setTxForm({ ...txForm, currentPassword: e.target.value })}
                placeholder="Enter your account login password"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">New Transaction Password</label>
              <input
                type="password" value={txForm.newTransactionPassword} required minLength={4}
                onChange={(e) => setTxForm({ ...txForm, newTransactionPassword: e.target.value })}
                placeholder="Min 4 characters"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Confirm New Transaction Password</label>
              <input
                type="password" value={txForm.confirmTransactionPassword} required
                onChange={(e) => setTxForm({ ...txForm, confirmTransactionPassword: e.target.value })}
                placeholder="Repeat new transaction password"
                className={inputClass}
              />
            </div>

            <button
              type="submit" disabled={txLoading}
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-3 text-sm font-bold text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition mt-1"
            >
              {txLoading ? 'Updating...' : 'Update Transaction Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default SecurityPage;
