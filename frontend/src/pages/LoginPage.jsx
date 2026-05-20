import { useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError('');
    setIsSubmitting(true);
    try {
      const response = await login(form);
      navigate(response.user?.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      console.error('Login error', err);
      setError(err?.response?.data?.message || err.message || 'Login failed');
      setIsSubmitting(false);
    }
  };

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

          {error && <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-rose-300">{error}</div>}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white shadow-inner outline-none focus:border-cyan-400"
                required
              />
            </label>
            <label className="block">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-slate-300">Password</span>
                <Link to="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white shadow-inner outline-none focus:border-cyan-400"
                required
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-2xl px-4 py-3 font-semibold text-slate-950 transition ${isSubmitting ? 'bg-slate-600 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400'}`}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-4 text-center">
            <p className="text-sm text-slate-400">Don't have an account?</p>
            <Link
              to="/register"
              className="mt-2 block w-full rounded-xl border border-cyan-500 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/10 hover:text-cyan-200"
            >
              Create free account
            </Link>
          </div>
        </div>

        <div className="hidden lg:flex flex-col justify-center items-center space-y-6">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=300&fit=crop&crop=center"
              alt="Cryptocurrency market analysis"
              className="rounded-3xl shadow-2xl animate-float"
            />
            <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm rounded-2xl p-4 text-white">
              <p className="text-sm font-semibold">Live market data</p>
              <p className="text-xs text-slate-300">Monitor prices and trends in real-time</p>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=400&h=300&fit=crop&crop=center"
              alt="Trading platform interface"
              className="rounded-3xl shadow-2xl animate-pulse"
            />
            <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm rounded-2xl p-4 text-white">
              <p className="text-sm font-semibold">Secure trading</p>
              <p className="text-xs text-slate-300">Trade with confidence on our platform</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
