import { useEffect, useState } from 'react';
import requestService from '../services/requestService';

const Field = ({ label, value }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">{label}</p>
    <p className="text-sm text-white font-mono break-all">{value || <span className="text-slate-600 italic not-italic font-sans">Not provided</span>}</p>
  </div>
);

const statusStyle = (s) =>
  s === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
  s === 'rejected'  ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                      'bg-amber-500/20 text-amber-400 border-amber-500/20';

const AdminDepositPage = () => {
  const [requests, setRequests]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [notes, setNotes]             = useState({});
  const [acting, setActing]           = useState({});
  const [lightbox, setLightbox]       = useState(null);
  const [certLoading, setCertLoading] = useState({});
  const [certs, setCerts]             = useState({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { deposits } = await requestService.getAllDeposits();
      setRequests(deposits);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load deposit requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadCert = async (id) => {
    if (certs[id] || certLoading[id]) return;
    setCertLoading((p) => ({ ...p, [id]: true }));
    try {
      const { deposit } = await requestService.getDepositById(id);
      setCerts((p) => ({ ...p, [id]: deposit.certificate || null }));
    } catch {
      setCerts((p) => ({ ...p, [id]: null }));
    } finally {
      setCertLoading((p) => ({ ...p, [id]: false }));
    }
  };

  const handleAction = async (id, action) => {
    setActing((p) => ({ ...p, [id]: true }));
    setError('');
    try {
      if (action === 'approve') await requestService.approveDeposit(id, notes[id]);
      else                      await requestService.rejectDeposit(id, notes[id]);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setActing((p) => ({ ...p, [id]: false }));
    }
  };

  const pending = requests.filter((r) => r.status === 'pending');
  const done    = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-[#070B12] px-4 py-6 text-slate-100">

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Certificate" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" />
        </div>
      )}

      <div className="mx-auto max-w-3xl space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Deposit Requests</h1>
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
            Loading deposit requests...
          </div>
        )}

        {/* Pending requests */}
        {!loading && pending.length === 0 && !error && (
          <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] px-5 py-10 text-center text-sm text-slate-500">
            No pending deposit requests.
          </div>
        )}

        {pending.map((r) => (
          <div key={r._id} className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] overflow-hidden">

            {/* Top bar: user + amount + status */}
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-800/60">
              <div>
                <p className="font-semibold text-white">{r.userId?.name || '—'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.userId?.email || '—'}</p>
                <p className="text-[11px] text-slate-600 mt-1">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black text-emerald-400">${r.amount.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">USDT · will be credited on approve</p>
              </div>
            </div>

            {/* Chain + transfer address + tx ID */}
            <div className="px-5 py-4 border-b border-slate-800/60 space-y-3">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                  {r.chain || 'Unknown chain'}
                </span>
              </div>
              <Field label="Transfer Address (From)" value={r.transferAddress} />
              <Field label="Transaction ID / Hash" value={r.transactionId} />
            </div>

            {/* Certificate — loaded on demand */}
            <div className="px-5 py-4 border-b border-slate-800/60">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-600">Certificate / Screenshot</p>
                {!certs[r._id] && (
                  <button
                    onClick={() => loadCert(r._id)}
                    disabled={certLoading[r._id]}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition underline"
                  >
                    {certLoading[r._id] ? 'Loading...' : 'Load Certificate'}
                  </button>
                )}
              </div>
              {certs[r._id] ? (
                <img
                  src={certs[r._id]}
                  alt="Deposit certificate"
                  onClick={() => setLightbox(certs[r._id])}
                  className="w-full max-h-56 object-contain rounded-xl border border-slate-700/40 hover:border-emerald-500/40 cursor-zoom-in transition"
                />
              ) : (
                <div className="rounded-xl border border-dashed border-slate-700/40 px-4 py-6 text-center text-sm text-slate-600">
                  {certLoading[r._id] ? 'Loading certificate...' : 'Click "Load Certificate" to view'}
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
                  {acting[r._id] ? 'Processing...' : `✓ Approve — credit $${r.amount.toFixed(2)}`}
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
        {done.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-600 px-1 pt-2">History</p>
            {done.map((r) => (
              <div key={r._id} className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.04] px-4 py-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-white">{r.userId?.name}
                      <span className="text-slate-400 font-normal"> · ${r.amount.toFixed(2)} USDT</span>
                    </p>
                    {r.chain && <p className="text-[11px] text-slate-500">{r.chain}</p>}
                    {r.transactionId && <p className="text-[11px] text-slate-600 font-mono truncate max-w-xs">{r.transactionId}</p>}
                    <p className="text-[11px] text-slate-600">{new Date(r.createdAt).toLocaleString()}</p>
                    {r.note && <p className="text-[11px] text-slate-500 italic">{r.note}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle(r.status)}`}>
                      {r.status}
                    </span>
                    <button
                      onClick={async () => {
                        if (certs[r._id]) { setLightbox(certs[r._id]); return; }
                        setCertLoading((p) => ({ ...p, [r._id]: true }));
                        try {
                          const { deposit } = await requestService.getDepositById(r._id);
                          const img = deposit.certificate || null;
                          setCerts((p) => ({ ...p, [r._id]: img }));
                          if (img) setLightbox(img);
                        } finally {
                          setCertLoading((p) => ({ ...p, [r._id]: false }));
                        }
                      }}
                      disabled={certLoading[r._id]}
                      className="text-[11px] text-slate-500 hover:text-slate-300 disabled:opacity-40 transition underline"
                    >
                      {certLoading[r._id] ? 'Loading...' : 'View cert'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDepositPage;
