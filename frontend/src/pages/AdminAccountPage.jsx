import { useState } from 'react';
import api from '../services/api';

const AdminAccountPage = () => {
  const [form, setForm]       = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.newPassword.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (form.newPassword !== form.confirmPassword) { setError('New passwords do not match.'); return; }
    setLoading(true);
    try {
      const { data } = await api.put('/auth/me/password', {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      setSuccess(data.message || 'Password updated successfully.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald-500 placeholder-slate-600 transition';

  return (
    <div className="min-h-screen bg-[#070B12] px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-lg space-y-5">

        <div>
          <h1 className="text-xl font-bold text-white">Account</h1>
          <p className="text-xs text-slate-500 mt-0.5">Change your login password</p>
        </div>

        <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/60">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Login Password</p>
              <p className="text-xs text-slate-500">Used to sign in to the admin panel</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            {error   && <div className="rounded-xl bg-red-500/10 px-3 py-2.5 text-xs text-red-400">{error}</div>}
            {success && <div className="rounded-xl bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400">{success}</div>}

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Current Password</label>
              <input
                type="password" value={form.currentPassword} required
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                placeholder="Enter your current password"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">New Password</label>
              <input
                type="password" value={form.newPassword} required minLength={6}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Min 6 characters"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Confirm New Password</label>
              <input
                type="password" value={form.confirmPassword} required
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Repeat new password"
                className={inputClass}
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition mt-1"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AdminAccountPage;
