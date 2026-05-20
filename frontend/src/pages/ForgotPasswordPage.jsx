import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-slate-900/90 p-10 shadow-xl shadow-slate-950/20">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-white">Forgot password?</h1>
          <p className="text-slate-400">Enter your email and we'll send you a reset link.</p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-500/10 px-4 py-4 text-emerald-300 text-sm text-center">
              If an account exists for <strong>{email}</strong>, a password reset link has been sent. Check your inbox (and spam folder).
            </div>
            <Link
              to="/login"
              className="block w-full rounded-2xl bg-cyan-500 px-4 py-3 text-center font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <>
            {error && <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-rose-300 text-sm">{error}</div>}
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white shadow-inner outline-none focus:border-cyan-400"
                  required
                  autoFocus
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full rounded-2xl px-4 py-3 font-semibold text-slate-950 transition ${isSubmitting ? 'bg-slate-600 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400'}`}
              >
                {isSubmitting ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
            <p className="text-center text-sm text-slate-400">
              Remember your password?{' '}
              <Link to="/login" className="text-cyan-300 hover:text-cyan-200">
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
