import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Reset failed. The link may be expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-slate-950">
        <div className="w-full max-w-md rounded-3xl bg-slate-900/90 p-10 text-center space-y-4">
          <p className="text-rose-300">Invalid or missing reset token.</p>
          <Link to="/forgot-password" className="text-cyan-300 hover:text-cyan-200 text-sm">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-slate-900/90 p-10 shadow-xl shadow-slate-950/20">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-white">Set new password</h1>
          <p className="text-slate-400">Choose a strong password for your account.</p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-500/10 px-4 py-4 text-emerald-300 text-sm text-center">
              Password updated! Redirecting to login...
            </div>
            <Link
              to="/login"
              className="block w-full rounded-2xl bg-cyan-500 px-4 py-3 text-center font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Go to login
            </Link>
          </div>
        ) : (
          <>
            {error && <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-rose-300 text-sm">{error}</div>}
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">New password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white shadow-inner outline-none focus:border-cyan-400"
                  required
                  minLength={6}
                  autoFocus
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Confirm new password</span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white shadow-inner outline-none focus:border-cyan-400"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full rounded-2xl px-4 py-3 font-semibold text-slate-950 transition ${isSubmitting ? 'bg-slate-600 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400'}`}
              >
                {isSubmitting ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
