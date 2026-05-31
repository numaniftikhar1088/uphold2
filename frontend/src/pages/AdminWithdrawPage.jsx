import { useEffect, useState } from 'react';
import requestService from '../services/requestService';

const AdminWithdrawPage = () => {
  const [requests, setRequests]               = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');
  const [notes, setNotes]                     = useState({});
  const [approvedAmounts, setApprovedAmounts] = useState({});
  const [acting, setActing]                   = useState({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { withdraws } = await requestService.getAllWithdraws();
      setRequests(withdraws);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load withdraw requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id, action, requestedAmount) => {
    setActing((p) => ({ ...p, [id]: true }));
    setError('');
    try {
      if (action === 'approve') {
        const typed = parseFloat(approvedAmounts[id]);
        const amountToDeduct = !isNaN(typed) && typed > 0 ? typed : requestedAmount;
        await requestService.approveWithdraw(id, notes[id], amountToDeduct);
      } else {
        await requestService.rejectWithdraw(id, notes[id]);
      }
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Action failed.');
    } finally {
      setActing((p) => ({ ...p, [id]: false }));
    }
  };

  const statusStyle = (s) =>
    s === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
    s === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
    'bg-amber-500/20 text-amber-400 border-amber-500/20';

  const pending = requests.filter((r) => r.status === 'pending');
  const done    = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-[#070B12] px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Withdrawal Requests</h1>
            <p className="text-xs text-slate-500 mt-0.5">{pending.length} pending</p>
          </div>
          <button onClick={load} className="rounded-xl bg-slate-800/60 border border-slate-700/40 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition">
            Refresh
          </button>
        </div>

        {error && <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>}

        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : pending.length === 0 ? (
          <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] px-5 py-8 text-center text-sm text-slate-500">
            No pending withdrawal requests.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r._id} className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] p-5 space-y-4">

                {/* User + requested amount */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-white">{r.userId?.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.userId?.email}</p>
                    <p className="text-xs text-slate-600 mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">${r.amount.toFixed(2)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Requested amount</p>
                    <p className="text-xs text-slate-500 mt-0.5">Fee: ${(r.transactionFee ?? 3).toFixed(2)} USDT</p>
                    <p className="text-xs text-slate-500 mt-0.5">Balance: ${r.userId?.balance?.toFixed(2)}</p>
                  </div>
                </div>

                {/* Chain + address / Bank details */}
                {r.withdrawMethod === 'bank' ? (
                  <div className="rounded-xl bg-slate-800/40 border border-blue-500/20 px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-xs font-bold text-blue-400">
                        Bank Transfer
                      </span>
                    </div>
                    {r.bankAccountSnapshot ? (
                      <div className="space-y-1.5">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">Account Holder</p>
                          <p className="text-sm text-white font-semibold">{r.bankAccountSnapshot.name || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">Account Number</p>
                          <p className="text-sm text-white font-mono">{r.bankAccountSnapshot.accountNumber || '—'}</p>
                        </div>
                        {r.bankAccountSnapshot.bankBranch && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">Bank Branch</p>
                            <p className="text-sm text-white">{r.bankAccountSnapshot.bankBranch}</p>
                          </div>
                        )}
                        {r.bankAccountSnapshot.ifscCode && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">IFSC Code</p>
                            <p className="text-sm text-white font-mono">{r.bankAccountSnapshot.ifscCode}</p>
                          </div>
                        )}
                        {r.bankAccountSnapshot.bankName && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">Bank Name</p>
                            <p className="text-sm text-white">{r.bankAccountSnapshot.bankName}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No bank details available.</p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                        {r.chain || '—'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">Withdrawal Address</p>
                      <p className="text-sm text-white font-mono break-all">{r.withdrawalAddress || '—'}</p>
                    </div>
                  </div>
                )}

                {/* Amount to deduct input */}
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Amount to Deduct (USD)</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 rounded-xl bg-slate-800/60 border border-slate-700/40 px-4 py-2.5 flex items-center gap-2">
                      <span className="text-slate-500 text-sm font-semibold">$</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={approvedAmounts[r._id] ?? ''}
                        onChange={(e) => setApprovedAmounts((p) => ({ ...p, [r._id]: e.target.value }))}
                        placeholder={`Default: ${r.amount.toFixed(2)}`}
                        className="flex-1 bg-transparent text-sm text-white outline-none placeholder-slate-600"
                      />
                    </div>
                    <p className="text-[11px] text-slate-600 shrink-0">Requested: <span className="text-slate-400">${r.amount.toFixed(2)}</span></p>
                  </div>
                  <p className="text-[11px] text-slate-600">Leave blank to deduct the requested amount exactly.</p>
                </div>

                {/* Admin action */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <textarea
                    value={notes[r._id] || ''}
                    onChange={(e) => setNotes((p) => ({ ...p, [r._id]: e.target.value }))}
                    placeholder="Optional note to user"
                    rows={2}
                    className="flex-1 rounded-xl border border-slate-700/40 bg-slate-800/40 px-3 py-2 text-sm text-slate-100 outline-none resize-none focus:border-slate-500 transition"
                  />
                  <div className="flex gap-2 sm:flex-col sm:justify-center">
                    <button
                      disabled={acting[r._id]}
                      onClick={() => handleAction(r._id, 'approve', r.amount)}
                      className="flex-1 sm:flex-none rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-40 transition whitespace-nowrap"
                    >
                      {acting[r._id] ? '...' : `✓ Approve -$${
                        approvedAmounts[r._id] && parseFloat(approvedAmounts[r._id]) > 0
                          ? parseFloat(approvedAmounts[r._id]).toFixed(2)
                          : r.amount.toFixed(2)
                      }`}
                    </button>
                    <button
                      disabled={acting[r._id]}
                      onClick={() => handleAction(r._id, 'reject', r.amount)}
                      className="flex-1 sm:flex-none rounded-xl bg-rose-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-rose-400 disabled:opacity-40 transition whitespace-nowrap"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History */}
        {done.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-slate-600 px-1">History</p>
            {done.map((r) => (
              <div key={r._id} className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.04] px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {r.userId?.name}
                    <span className="text-slate-500 font-normal"> · ${r.amount.toFixed(2)} requested</span>
                    {r.approvedAmount != null && r.status === 'approved' && (
                      <span className="text-rose-400 font-normal"> → -${r.approvedAmount.toFixed(2)} deducted</span>
                    )}
                  </p>
                  {r.withdrawMethod === 'bank' && r.bankAccountSnapshot ? (
                    <p className="text-[11px] text-slate-600 mt-0.5">Bank: {r.bankAccountSnapshot.name} · {r.bankAccountSnapshot.accountNumber}</p>
                  ) : r.withdrawalAddress ? (
                    <p className="text-[11px] text-slate-600 font-mono mt-0.5 truncate max-w-xs">{r.withdrawalAddress}</p>
                  ) : null}
                  <p className="text-[11px] text-slate-600 mt-0.5">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyle(r.status)}`}>{r.status}</span>
                  {r.note && <p className="text-[11px] text-slate-500 mt-1 italic">{r.note}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWithdrawPage;
