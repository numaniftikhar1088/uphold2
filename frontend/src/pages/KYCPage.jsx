import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import kycService from '../services/kycService';

const KYCPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', idCardNumber: '', contactNumber: '' });
  const [idFront, setIdFront] = useState(null);
  const [idBack,  setIdBack]  = useState(null);
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload  = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Unable to read file'));
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.fullName.trim())      { setError('Full name is required.');          return; }
    if (!form.idCardNumber.trim())  { setError('ID card number is required.');     return; }
    if (!form.contactNumber.trim()) { setError('Contact number is required.');     return; }
    if (!idFront)                   { setError('ID front image is required.');     return; }
    if (!idBack)                    { setError('ID back image is required.');      return; }

    setLoading(true);
    try {
      const payload = {
        fullName:      form.fullName.trim(),
        idCardNumber:  form.idCardNumber.trim(),
        contactNumber: form.contactNumber.trim(),
        idFront: await fileToBase64(idFront),
        idBack:  await fileToBase64(idBack),
        note,
      };
      const { user: updated } = await kycService.submitKyc(payload);
      updateUser(updated);
      setSuccess('KYC submitted successfully. Your verification is now under review.');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to submit KYC.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald-500 placeholder-slate-600 transition';

  /* ── Status screens ── */
  if (user?.kycStatus === 'verified') {
    return (
      <StatusScreen
        navigate={navigate}
        icon="check"
        color="emerald"
        title="Identity Verified"
        message="Your identity has been successfully verified. You have full access to all platform features."
      />
    );
  }
  if (user?.kycStatus === 'pending') {
    return (
      <StatusScreen
        navigate={navigate}
        icon="clock"
        color="yellow"
        title="Verification Pending"
        message="Your documents are under review. This usually takes 1–2 business days. We'll notify you once complete."
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100">

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-4 py-4 border-b border-slate-800/60">
        <button onClick={() => navigate(-1)} className="p-1 text-slate-400 hover:text-white transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-base font-semibold">KYC Verification</span>
        <div className="w-8" />
      </div>

      <div className="px-4 py-6 md:px-6 md:py-10 max-w-3xl mx-auto space-y-5">

        {/* Header card */}
        <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] px-5 py-5">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Identity</p>
          <h1 className="mt-0.5 text-xl font-bold text-white">KYC Verification</h1>
          <p className="mt-1 text-xs text-slate-400">
            Verify your identity to unlock full platform access. Your information is stored securely.
          </p>
          {user?.kycStatus === 'rejected' && (
            <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              Your previous submission was rejected. Please re-submit with clear, valid documents.
            </div>
          )}
        </div>

        {/* Main form */}
        <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] p-5">

          {error   && <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
          {success && <div className="mb-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Personal info */}
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Personal Information</h2>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Full Name (as on ID card)</label>
                <input
                  name="fullName" value={form.fullName} onChange={handleChange}
                  placeholder="Enter your full name exactly as it appears on your ID"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">ID Card Number</label>
                  <input
                    name="idCardNumber" value={form.idCardNumber} onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Contact Number</label>
                  <input
                    name="contactNumber" value={form.contactNumber} onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800/60 pt-1" />

            {/* Document uploads */}
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">ID Documents</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UploadBox
                  label="ID Front"
                  hint="Upload the front side of your ID card"
                  file={idFront}
                  onChange={(e) => setIdFront(e.target.files?.[0] || null)}
                />
                <UploadBox
                  label="ID Back"
                  hint="Upload the back side of your ID card"
                  file={idBack}
                  onChange={(e) => setIdBack(e.target.files?.[0] || null)}
                />
              </div>

              {/* Preview row */}
              {(idFront || idBack) && (
                <div className="grid grid-cols-2 gap-3">
                  {idFront && (
                    <div className="rounded-xl overflow-hidden ring-1 ring-emerald-500/30">
                      <img src={URL.createObjectURL(idFront)} alt="ID Front Preview"
                        className="w-full h-28 object-cover" />
                    </div>
                  )}
                  {idBack && (
                    <div className="rounded-xl overflow-hidden ring-1 ring-emerald-500/30">
                      <img src={URL.createObjectURL(idBack)} alt="ID Back Preview"
                        className="w-full h-28 object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Optional note */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Additional Note (optional)</label>
              <textarea
                value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Any additional information for the verification team..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Submit */}
            {!success && (
              <button
                type="submit" disabled={loading}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3.5 text-sm font-bold text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Submitting...' : 'Submit KYC Documents'}
              </button>
            )}
          </form>
        </div>

        {/* Tips card */}
        <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Tips for a successful review</h3>
          <ul className="space-y-2">
            {[
              'Use a clear, well-lit photo — avoid blurry or dark images.',
              'Make sure all text on your ID is clearly readable.',
              'Upload the complete document — no cropping of edges.',
              'Use JPG or PNG format, up to 10MB per image.',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-400">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
};

/* ── Upload box component ── */
const UploadBox = ({ label, hint, file, onChange }) => (
  <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-slate-700/60 bg-slate-800/20 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition group">
    {file ? (
      <div className="flex flex-col items-center gap-1 px-3 text-center">
        <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-xs text-emerald-300 font-medium truncate max-w-[160px]">{file.name}</p>
        <p className="text-[10px] text-slate-600">Tap to replace</p>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-1.5 px-3 text-center">
        <svg className="w-7 h-7 text-slate-600 group-hover:text-slate-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-xs font-semibold text-slate-400">{label}</p>
        <p className="text-[10px] text-slate-600">{hint}</p>
      </div>
    )}
    <input type="file" accept="image/*" className="hidden" onChange={onChange} />
  </label>
);

/* ── Status screen ── */
const StatusScreen = ({ navigate, icon, color, title, message }) => (
  <div className="min-h-screen bg-[#070B12] text-white flex flex-col">
    <div className="md:hidden flex items-center px-4 py-4 border-b border-slate-800/60">
      <button onClick={() => navigate(-1)} className="p-1 text-slate-400 hover:text-white transition">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="ml-3 text-base font-semibold">KYC Verification</span>
    </div>
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto bg-${color}-500/15`}>
          {icon === 'check' ? (
            <svg className={`w-10 h-10 text-${color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className={`w-10 h-10 text-${color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="text-sm text-slate-400">{message}</p>
        <button onClick={() => navigate('/')}
          className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition">
          Back to Dashboard
        </button>
      </div>
    </div>
  </div>
);

export default KYCPage;
