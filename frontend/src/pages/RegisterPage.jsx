import { useId, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import PasswordInput from '../components/PasswordInput';

const UpholdLogo = ({ size = 36 }) => {
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

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    transactionPassword: '', confirmTransactionPassword: '',
    referralCode: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // null | 'checking' | 'valid' | 'invalid'
  const [refStatus, setRefStatus] = useState(null);
  const refCheckRef = useRef(null);
  const navigate = useNavigate();
  const { register } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setForm((prev) => ({ ...prev, referralCode: ref.toUpperCase() }));
  }, [searchParams]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'referralCode') setRefStatus(null);
  };

  const handleReferralBlur = async () => {
    const code = form.referralCode.trim().toUpperCase();
    if (!code) { setRefStatus(null); return; }
    setRefStatus('checking');
    // Debounce: cancel any in-flight check
    clearTimeout(refCheckRef.current);
    refCheckRef.current = setTimeout(async () => {
      try {
        const { valid } = await authService.checkReferralCode(code);
        setRefStatus(valid ? 'valid' : 'invalid');
      } catch {
        setRefStatus(null);
      }
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (!form.transactionPassword || form.transactionPassword.length < 4) {
      setError('Transaction password must be at least 4 characters.');
      return;
    }
    if (form.transactionPassword !== form.confirmTransactionPassword) {
      setError('Transaction passwords do not match.');
      return;
    }
    if (!form.referralCode.trim()) {
      setError('Referral code is required.');
      return;
    }
    if (refStatus !== 'valid') {
      setError('Please enter a valid referral code.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        transactionPassword: form.transactionPassword,
        referralCode: form.referralCode.trim().toUpperCase(),
      });
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed');
      setIsSubmitting(false);
    }
  };

  const inputClass = 'w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white shadow-inner outline-none focus:border-emerald-400 transition';

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">

        <div className="w-full max-w-md space-y-6 rounded-3xl bg-slate-900/90 p-10 shadow-xl shadow-slate-950/20 mx-auto lg:mx-0 animate-scale-in">
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-3">
              <UpholdLogo size={40} />
              <span className="text-2xl font-bold text-white">UPhold</span>
            </div>
            <p className="text-slate-400">Enter credentials to continue with UPhold.</p>
          </div>

          {error && <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Full name</span>
              <input type="text" name="name" value={form.name} onChange={handleChange} className={inputClass} required />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Email</span>
              <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} required />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Password</span>
                <PasswordInput name="password" value={form.password} onChange={handleChange} className={inputClass} required minLength={6} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Confirm password</span>
                <PasswordInput name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className={inputClass} required />
              </label>
            </div>

            {/* Transaction Password section */}
            <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm font-semibold text-emerald-400">Transaction Password</span>
              </div>
              <p className="text-xs text-slate-500">Used to authorize withdrawals, deposits, and payment method changes.</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-xs text-slate-400">Set password</span>
                  <PasswordInput name="transactionPassword" value={form.transactionPassword}
                    onChange={handleChange} className={inputClass} required minLength={4} placeholder="Min 4 chars" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs text-slate-400">Confirm</span>
                  <PasswordInput name="confirmTransactionPassword" value={form.confirmTransactionPassword}
                    onChange={handleChange} className={inputClass} required />
                </label>
              </div>
            </div>

            <div className="block">
              <span className="mb-2 block text-sm text-slate-300">Referral Code</span>
              <div className="relative">
                <input
                  type="text" name="referralCode" value={form.referralCode}
                  onChange={handleChange}
                  onBlur={handleReferralBlur}
                  placeholder="Enter referral code"
                  maxLength={5}
                  className={`${inputClass} pr-10 ${
                    refStatus === 'valid'   ? 'border-emerald-500' :
                    refStatus === 'invalid' ? 'border-rose-500'    : ''
                  }`}
                  style={{ textTransform: 'uppercase' }}
                />
                {/* Status icon */}
                {refStatus === 'checking' && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  </span>
                )}
                {refStatus === 'valid' && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
                {refStatus === 'invalid' && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                )}
              </div>
              {refStatus === 'valid'   && <p className="mt-1.5 text-xs text-emerald-400">Valid referral code.</p>}
              {refStatus === 'invalid' && <p className="mt-1.5 text-xs text-rose-400">Referral code not found.</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-2xl px-4 py-3 font-semibold text-slate-950 transition ${
                isSubmitting ? 'bg-slate-600 cursor-not-allowed text-white' : 'bg-emerald-500 hover:bg-emerald-400'
              }`}
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-4 text-center">
            <p className="text-sm text-slate-400">Already have an account?</p>
            <Link to="/login"
              className="mt-2 block w-full rounded-xl border border-slate-600 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300">
              Log in
            </Link>
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-semibold">Disclaimer</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              UPhold is an independent platform. We are not affiliated, associated, or in any way officially connected with uphold.com or uphold Exchange.
            </p>
          </div>
        </div>

        <div className="hidden lg:flex flex-col justify-center items-center space-y-6">
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop&crop=center"
              alt="Trading charts" className="rounded-3xl shadow-2xl" />
            <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm rounded-2xl p-4 text-white">
              <p className="text-sm font-semibold">Real-time market insights</p>
              <p className="text-xs text-slate-300">Track crypto trends and make informed trades</p>
            </div>
          </div>
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop&crop=center"
              alt="Cryptocurrency trading" className="rounded-3xl shadow-2xl" />
            <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm rounded-2xl p-4 text-white">
              <p className="text-sm font-semibold">Advanced trading tools</p>
              <p className="text-xs text-slate-300">Access professional-grade features</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
