import { useNavigate } from 'react-router-dom';

const STATUS_MESSAGE = {
  not_submitted: 'You need to complete KYC verification before you can use this feature.',
  pending: 'Your KYC submission is under review. You can use this feature once it is approved.',
  rejected: 'Your KYC was rejected. Please resubmit your documents to continue.',
};

const KycGateModal = ({ status = 'not_submitted' }) => {
  const navigate = useNavigate();
  const message = STATUS_MESSAGE[status] ?? STATUS_MESSAGE.not_submitted;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-sm px-4 pt-16 sm:pt-20">
      <div className="w-full max-w-sm rounded-3xl bg-[#0D1421] ring-1 ring-white/[0.08] p-6 shadow-2xl space-y-5 text-center">

        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center">
          <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white">KYC Verification Required</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={() => navigate('/kyc')}
            className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-slate-950 transition"
          >
            Verify KYC Now
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 py-3 text-sm font-semibold text-slate-300 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default KycGateModal;
