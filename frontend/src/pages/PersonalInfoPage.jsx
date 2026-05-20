import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from '../components/NotificationDropdown';

const kycLabel = {
  verified:      'Verified',
  pending:       'Pending Review',
  rejected:      'Rejected',
  not_submitted: 'Not Submitted',
};

const PersonalInfoPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const rows = [
    { label: 'Full Name',        value: user?.name },
    { label: 'Email Address',    value: user?.email },
    { label: 'Account Balance',  value: `$${user?.balance?.toFixed(2)}` },
    { label: 'KYC Status',       value: kycLabel[user?.kycStatus] ?? '-' },
    { label: 'Account Role',     value: user?.role },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <button onClick={() => navigate(-1)} className="p-1 text-slate-400 hover:text-white transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-base font-semibold">Personal Information</span>
        <NotificationDropdown />
      </div>

      {/* Avatar placeholder */}
      <div className="flex flex-col items-center py-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <span className="text-3xl font-extrabold text-slate-950">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </span>
        </div>
        <p className="mt-3 text-lg font-bold text-white">{user?.name}</p>
        <p className="text-sm text-slate-500">{user?.email}</p>
      </div>

      {/* Info rows */}
      <div className="px-4 space-y-3 pb-8">
        {rows.map(({ label, value }) => (
          <div key={label} className="rounded-2xl bg-slate-900 px-5 py-4 ring-1 ring-white/5">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="mt-1 text-base font-semibold text-white truncate">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalInfoPage;
