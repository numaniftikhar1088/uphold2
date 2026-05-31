import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import requestService from '../services/requestService';
import KycGateModal from '../components/KycGateModal';

const CHAINS = {
  'BEP-20': '0x5e3d8eb4f58ef70f9df0bbeda1a6310c79a1708a',
  'TRC-20': 'TPoZuZEqaHHm8aK9TUn57qiKXVSvjsYk2e',
};

const METHODS = ['BEP-20', 'TRC-20', 'Bank Transfer'];

const compressImage = (file, maxWidth = 1024, quality = 0.75) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Unable to load image'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
  });

const DepositPage = () => {
  const { user, token } = useAuth();

  const [method, setMethod]                 = useState('BEP-20');
  const [amount, setAmount]                 = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [transactionId, setTransactionId]   = useState('');
  const [transactionPassword, setTransactionPassword] = useState('');
  const [certificate, setCertificate]       = useState(null);
  const [certificatePreview, setCertificatePreview] = useState('');
  const [copied, setCopied]                 = useState(false);
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState('');
  const [requests, setRequests]             = useState([]);
  const [loading, setLoading]               = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    requestService.getMyDeposits()
      .then(({ deposits }) => setRequests(deposits))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const isCrypto = method !== 'Bank Transfer';
  const walletAddress = isCrypto ? CHAINS[method] : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCertificateChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCertificate(file);
    setCertificatePreview(URL.createObjectURL(file));
  };

  const handleMethodChange = (m) => {
    setMethod(m);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const value = Number(amount);
    if (!value || value <= 0)         { setError('Enter a valid deposit amount.'); return; }
    if (isCrypto && !transferAddress.trim()) { setError('Transfer address is required.'); return; }
    if (!transactionId.trim())        { setError('Transaction ID is required.'); return; }
    if (!transactionPassword)         { setError('Transaction password is required.'); return; }
    if (!certificate)                 { setError('Please attach a certificate screenshot.'); return; }

    setSubmitting(true);
    try {
      const certBase64 = await compressImage(certificate);
      const { deposit } = await requestService.createDeposit(
        value, method, isCrypto ? transferAddress : '', transactionId, certBase64, transactionPassword
      );
      setSuccess('Deposit request submitted successfully. Admin will review and credit your account.');
      setRequests((prev) => [deposit, ...prev]);
      setAmount(''); setTransferAddress(''); setTransactionId('');
      setTransactionPassword(''); setCertificate(null); setCertificatePreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to submit deposit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusStyle = (s) =>
    s === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
    s === 'rejected' ? 'bg-red-500/20 text-red-400' :
    'bg-amber-500/20 text-amber-400';

  const inputClass = 'w-full bg-transparent text-sm text-white outline-none placeholder-slate-600';

  const qrUrl = isCrypto
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(walletAddress)}&bgcolor=0d1421&color=ffffff&margin=8`
    : null;

  const kycBlocked = user?.kycStatus !== 'verified';

  return (
    <div className="min-h-screen bg-[#070B12] px-3 py-5 text-slate-100 md:px-5 md:py-7">
      {kycBlocked && <KycGateModal status={user?.kycStatus} />}
      <div className="mx-auto max-w-lg space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Finance</p>
            <h1 className="mt-0.5 text-xl font-bold text-white">Deposit</h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Balance</p>
            <p className="text-lg font-bold text-white">${user?.balance?.toFixed(2)}</p>
          </div>
        </div>

        {/* Method selector card */}
        <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm font-semibold text-white">Select Method</p>
            <div className="flex gap-2 flex-wrap">
              {METHODS.map((m) => (
                <button
                  key={m} type="button"
                  onClick={() => handleMethodChange(m)}
                  className={`rounded-2xl px-5 py-2 text-sm font-bold transition ${
                    method === m
                      ? m === 'Bank Transfer'
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Crypto QR section */}
          {isCrypto && (
            <div className="border-t border-slate-800/60 px-5 py-5 flex flex-col items-center gap-3">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Scan QR Code and Pay</p>
              <div className="rounded-2xl border-2 border-emerald-500/30 p-2 bg-[#0a1120]">
                <img
                  src={qrUrl}
                  alt={`${method} QR code`}
                  className="w-40 h-40 rounded-lg"
                />
              </div>
              <p className="text-[11px] text-slate-300 font-mono text-center break-all px-2">{walletAddress}</p>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-full border border-emerald-500/40 px-6 py-1.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/10 transition"
              >
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
            </div>
          )}

          {/* Bank Transfer note */}
          {!isCrypto && (
            <div className="border-t border-slate-800/60 mx-5 mt-0 mb-4 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 flex items-start gap-2.5 mt-4">
              <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-300">
                For Bank Account Details Contact{' '}
                <Link to="/chat" className="font-semibold underline text-blue-200 hover:text-white transition">
                  Support
                </Link>.
              </p>
            </div>
          )}
        </div>

        {/* Form card */}
        <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] overflow-hidden">

          {error   && <div className="px-5 pt-4"><div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div></div>}
          {success && <div className="px-5 pt-4"><div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{success}</div></div>}

          <form onSubmit={handleSubmit} className="divide-y divide-slate-800/60">

            {/* Amount */}
            <div className="px-5 py-4 space-y-2">
              <p className="text-sm font-semibold text-white">Amount of deposit</p>
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 px-4 py-3">
                <input
                  type="number" step="any" min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Please enter the deposit amount"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Transfer address — crypto only */}
            {isCrypto && (
              <div className="px-5 py-4 space-y-2">
                <p className="text-sm font-semibold text-white">Transfer address</p>
                <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 px-4 py-3">
                  <input
                    value={transferAddress}
                    onChange={(e) => setTransferAddress(e.target.value)}
                    placeholder="Please enter the transfer address"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Transaction ID */}
            <div className="px-5 py-4 space-y-2">
              <p className="text-sm font-semibold text-white">Transaction ID</p>
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 px-4 py-3">
                <input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder={isCrypto ? 'Please enter the transaction hash' : 'Please enter the bank transaction ID'}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Transaction password */}
            <div className="px-5 py-4 space-y-2">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-sm font-semibold text-white">Transaction password</p>
              </div>
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 px-4 py-3">
                <input
                  type="password" value={transactionPassword}
                  onChange={(e) => setTransactionPassword(e.target.value)}
                  placeholder="Please enter the transaction password"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Certificate upload */}
            <div className="px-5 py-4 space-y-2">
              <p className="text-sm font-semibold text-white">Certificate</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCertificateChange}
                className="hidden"
              />
              {certificatePreview ? (
                <div className="relative">
                  <img
                    src={certificatePreview}
                    alt="Certificate preview"
                    className="w-full max-h-48 object-contain rounded-xl border border-slate-700/40"
                  />
                  <button
                    type="button"
                    onClick={() => { setCertificate(null); setCertificatePreview(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="absolute top-2 right-2 rounded-full bg-slate-900/80 p-1 text-slate-400 hover:text-red-400 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-36 h-36 rounded-xl bg-slate-800/40 border border-slate-700/40 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-slate-300 hover:border-slate-500 transition"
                >
                  <span className="text-3xl font-light leading-none">+</span>
                </button>
              )}
            </div>

            {/* Submit */}
            <div className="px-5 py-4">
              <button
                type="submit" disabled={submitting}
                className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 py-3.5 text-sm font-bold text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>

          </form>
        </div>

        {/* History */}
        <section className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Deposit History</h2>
            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] text-slate-400">{requests.length} requests</span>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-slate-500">No deposit requests yet.</p>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                <div key={r._id} className="rounded-xl bg-slate-800/30 border border-slate-800/60 px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                        r.chain === 'Bank Transfer'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-slate-700/60 text-slate-300'
                      }`}>{r.chain || '—'}</span>
                      <span className="font-semibold text-white text-sm">${r.amount.toFixed(2)}</span>
                      {r.approvedAmount != null && r.status === 'approved' && (
                        <span className="text-xs text-emerald-400">→ ${r.approvedAmount.toFixed(2)} credited</span>
                      )}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-mono truncate">{r.transactionId}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-600">{new Date(r.createdAt).toLocaleString()}</p>
                    {r.note && <p className="text-[11px] text-slate-500 italic">{r.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default DepositPage;
