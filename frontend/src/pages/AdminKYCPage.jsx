import { useEffect, useState } from 'react';
import kycService from '../services/kycService';

const Field = ({ label, value }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">{label}</p>
    <p className="text-sm text-white font-mono break-all">{value || <span className="text-slate-600 italic not-italic font-sans">Not provided</span>}</p>
  </div>
);

const statusStyle = (s) =>
  s === 'verified' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
  s === 'rejected'  ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                      'bg-amber-500/20 text-amber-400 border-amber-500/20';

const AdminKYCPage = () => {
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [notes, setNotes]         = useState({});
  const [acting, setActing]       = useState({});
  const [imgLoading, setImgLoading] = useState({});
  const [images, setImages]         = useState({});
  const [expanded, setExpanded]     = useState({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { users } = await kycService.getAllKyc();
      setRequests(users);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load KYC requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadImages = async (userId) => {
    if (images[userId] || imgLoading[userId]) return;
    setImgLoading((p) => ({ ...p, [userId]: true }));
    try {
      const { user } = await kycService.getKycDetail(userId);
      setImages((p) => ({ ...p, [userId]: { front: user.kycData?.idFront || null, back: user.kycData?.idBack || null } }));
    } catch {
      setImages((p) => ({ ...p, [userId]: { front: null, back: null } }));
    } finally {
      setImgLoading((p) => ({ ...p, [userId]: false }));
    }
  };

  const handleAction = async (userId, action) => {
    setActing((p) => ({ ...p, [userId]: true }));
    setError('');
    try {
      if (action === 'approve') await kycService.verifyKyc(userId, notes[userId]);
      else                      await kycService.rejectKyc(userId, notes[userId]);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setActing((p) => ({ ...p, [userId]: false }));
    }
  };

  const pending = requests.filter((r) => r.kycStatus === 'pending');
  const done    = requests.filter((r) => r.kycStatus !== 'pending');

  return (
    <div className="min-h-screen bg-[#070B12] px-4 py-6 text-slate-100">

      <div className="mx-auto max-w-3xl space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">KYC Verification</h1>
            <p className="text-xs text-slate-500 mt-0.5">{pending.length} pending · {done.length} processed</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl bg-slate-800/60 border border-slate-700/40 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40 transition"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {loading && (
          <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] px-5 py-10 text-center text-sm text-slate-500">
            Loading KYC requests...
          </div>
        )}

        {!loading && pending.length === 0 && !error && (
          <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] px-5 py-10 text-center text-sm text-slate-500">
            No pending KYC requests.
          </div>
        )}

        {/* Pending requests */}
        {!loading && pending.map((r) => (
          <div key={r._id} className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] overflow-hidden">

            {/* User info header */}
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-800/60">
              <div>
                <p className="font-semibold text-white">{r.name || '—'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.email || '—'}</p>
                <p className="text-[11px] text-slate-600 mt-1">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shrink-0 ${statusStyle(r.kycStatus)}`}>
                {r.kycStatus}
              </span>
            </div>

            {/* KYC details */}
            <div className="px-5 py-4 border-b border-slate-800/60 space-y-3">
              <Field label="Full Name"      value={r.kycData?.fullName} />
              <Field label="ID Card Number" value={r.kycData?.idCardNumber} />
              <Field label="Contact Number" value={r.kycData?.contactNumber} />
              {r.kycData?.note && <Field label="Note from User" value={r.kycData.note} />}
            </div>

            {/* ID card images — loaded on demand */}
            <div className="px-5 py-4 border-b border-slate-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider text-slate-600">ID Card Images</p>
                {!images[r._id] && (
                  <button
                    onClick={() => loadImages(r._id)}
                    disabled={imgLoading[r._id]}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition underline"
                  >
                    {imgLoading[r._id] ? 'Loading...' : 'Load ID Images'}
                  </button>
                )}
              </div>
              {images[r._id] ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {['front', 'back'].map((side) => (
                      <div key={side}>
                        <p className="text-[10px] text-slate-600 mb-1.5 capitalize">{side} Side</p>
                        {images[r._id][side] ? (
                          <img
                            src={images[r._id][side]}
                            alt={`ID ${side}`}
                            onClick={() => setExpanded((p) => ({ ...p, [r._id]: p[r._id] === side ? null : side }))}
                            className="w-full h-36 object-cover rounded-xl border border-slate-700/40 hover:border-emerald-500/40 cursor-zoom-in transition"
                          />
                        ) : (
                          <div className="w-full h-36 rounded-xl border border-dashed border-slate-700/40 flex items-center justify-center text-xs text-slate-600">Not provided</div>
                        )}
                      </div>
                    ))}
                  </div>
                  {expanded[r._id] && images[r._id][expanded[r._id]] && (
                    <div className="relative rounded-xl overflow-hidden border border-emerald-500/30">
                      <button
                        onClick={() => setExpanded((p) => ({ ...p, [r._id]: null }))}
                        className="absolute top-2 right-2 z-10 rounded-full bg-slate-900/80 p-1.5 text-slate-300 hover:text-white transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <img
                        src={images[r._id][expanded[r._id]]}
                        alt={`ID ${expanded[r._id]} expanded`}
                        className="w-full max-h-[480px] object-contain bg-slate-950"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-700/40 px-4 py-6 text-center text-sm text-slate-600">
                  {imgLoading[r._id] ? 'Loading images...' : 'Click "Load ID Images" to view documents'}
                </div>
              )}
            </div>

            {/* Approve / Reject */}
            <div className="px-5 py-4 space-y-3">
              <textarea
                value={notes[r._id] || ''}
                onChange={(e) => setNotes((p) => ({ ...p, [r._id]: e.target.value }))}
                placeholder="Optional note to user (e.g. reason for rejection)"
                rows={2}
                className="w-full rounded-xl border border-slate-700/40 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-100 outline-none resize-none focus:border-slate-500 placeholder-slate-600 transition"
              />
              <div className="flex gap-2">
                <button
                  disabled={acting[r._id]}
                  onClick={() => handleAction(r._id, 'approve')}
                  className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {acting[r._id] ? 'Processing...' : '✓ Approve KYC'}
                </button>
                <button
                  disabled={acting[r._id]}
                  onClick={() => handleAction(r._id, 'reject')}
                  className="rounded-xl bg-slate-800/60 border border-rose-500/30 px-5 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ✕ Reject
                </button>
              </div>
            </div>

          </div>
        ))}

        {/* Processed history */}
        {!loading && done.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-600 px-1 pt-2">History</p>
            {done.map((r) => (
              <div key={r._id} className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.04] px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-white">{r.name}
                      <span className="text-slate-400 font-normal"> · {r.email}</span>
                    </p>
                    {r.kycData?.fullName && <p className="text-[11px] text-slate-500">ID Name: {r.kycData.fullName}</p>}
                    {r.kycData?.idCardNumber && <p className="text-[11px] text-slate-600 font-mono">ID: {r.kycData.idCardNumber}</p>}
                    <p className="text-[11px] text-slate-600">{new Date(r.createdAt).toLocaleString()}</p>
                    {r.kycData?.note && <p className="text-[11px] text-slate-500 italic">{r.kycData.note}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle(r.kycStatus)}`}>
                      {r.kycStatus}
                    </span>
                    <div className="flex gap-1.5">
                      {['front', 'back'].map((side) => (
                        <button key={side}
                          disabled={imgLoading[r._id]}
                          onClick={async () => {
                            if (images[r._id]?.[side]) {
                              setExpanded((p) => ({ ...p, [r._id]: p[r._id] === side ? null : side }));
                              return;
                            }
                            setImgLoading((p) => ({ ...p, [r._id]: true }));
                            try {
                              const { user } = await kycService.getKycDetail(r._id);
                              const imgs = { front: user.kycData?.idFront || null, back: user.kycData?.idBack || null };
                              setImages((p) => ({ ...p, [r._id]: imgs }));
                              if (imgs[side]) setExpanded((p) => ({ ...p, [r._id]: side }));
                            } finally {
                              setImgLoading((p) => ({ ...p, [r._id]: false }));
                            }
                          }}
                          className="text-[11px] text-slate-500 hover:text-slate-300 disabled:opacity-40 transition underline capitalize"
                        >
                          {imgLoading[r._id] ? '...' : side}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {expanded[r._id] && images[r._id]?.[expanded[r._id]] && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700/40">
                    <button
                      onClick={() => setExpanded((p) => ({ ...p, [r._id]: null }))}
                      className="absolute top-2 right-2 z-10 rounded-full bg-slate-900/80 p-1.5 text-slate-300 hover:text-white transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <img
                      src={images[r._id][expanded[r._id]]}
                      alt={`ID ${expanded[r._id]}`}
                      className="w-full max-h-[400px] object-contain bg-slate-950"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminKYCPage;
