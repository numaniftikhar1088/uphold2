import { useEffect, useState, useCallback } from 'react';
import tradeService from '../services/tradeService';

const AdminTradesPage = () => {
  const [trades, setTrades]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [inputs, setInputs]   = useState({});   // { [tradeId]: { profit: '', loss: '' } }
  const [saving, setSaving]   = useState({});    // { [tradeId]: boolean }
  const [msgs, setMsgs]       = useState({});    // { [tradeId]: { text, ok } }

  const load = useCallback(async (isInitial = false) => {
    if (isInitial) setLoadError('');
    try {
      const { trades: list } = await tradeService.getPendingTrades();
      setTrades(list);
      setLoadError('');
      const init = {};
      list.forEach((t) => { init[t._id] = { profit: '', loss: '' }; });
      setInputs(init);
    } catch (err) {
      if (isInitial) {
        setLoadError(err?.response?.data?.message || 'Failed to load pending trades. Check your connection or admin access.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    const id = setInterval(() => load(false), 10000);
    return () => clearInterval(id);
  }, [load]);

  const setMsg = (id, text, ok) => {
    setMsgs((prev) => ({ ...prev, [id]: { text, ok } }));
    setTimeout(() => setMsgs((prev) => { const n = { ...prev }; delete n[id]; return n; }), 4000);
  };

  const handleSet = async (tradeId, type) => {
    const val = parseFloat(inputs[tradeId]?.[type]);
    if (!val || val <= 0) {
      setMsg(tradeId, `Enter a valid ${type} amount.`, false);
      return;
    }
    setSaving((prev) => ({ ...prev, [tradeId]: true }));
    try {
      await tradeService.setTradeResult(tradeId, { [type]: val });
      setMsg(tradeId, `${type.charAt(0).toUpperCase() + type.slice(1)} set successfully.`, true);
      setTrades((prev) => prev.filter((t) => t._id !== tradeId));
    } catch (err) {
      setMsg(tradeId, err?.response?.data?.message || 'Failed to set result.', false);
    } finally {
      setSaving((prev) => ({ ...prev, [tradeId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">

        <header className="rounded-3xl bg-slate-900/80 px-8 py-6 shadow-xl flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-300/70">Admin</p>
            <h1 className="mt-1 text-3xl font-bold text-white">Pending trades</h1>
            <p className="mt-1 text-sm text-slate-400">Auto-refreshes every 10 s. Set profit or loss to close a trade.</p>
          </div>
          <button
            onClick={() => load(true)}
            className="rounded-2xl bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition self-start sm:self-auto"
          >
            Refresh now
          </button>
        </header>

        {loadError && (
          <div className="rounded-3xl bg-rose-500/10 px-6 py-4 text-sm text-rose-300 ring-1 ring-rose-500/20">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-slate-900/80 p-8 text-center text-slate-400">Loading...</div>
        ) : loadError ? null : trades.length === 0 ? (
          <div className="rounded-3xl bg-slate-900/80 p-8 text-center text-slate-400">No pending trades.</div>
        ) : (
          <div className="space-y-4">
            {trades.map((trade) => {
              const opened = new Date(trade.openedAt || trade.createdAt);

              return (
                <div
                  key={trade._id}
                  className="rounded-3xl p-5 ring-1 shadow-lg bg-slate-900/80 ring-white/5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-white">{trade.symbol}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${trade.side === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {trade.side?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">
                        User: <span className="font-semibold text-white">{trade.userId?.name || trade.userId?.email || trade.userId}</span>
                      </p>
                      <p className="text-sm text-slate-300">
                        Amount: <span className="font-semibold text-white">${trade.amount?.toFixed(2)}</span>
                        {trade.entryPrice && (
                          <span className="ml-3 text-slate-500">@ ${trade.entryPrice?.toLocaleString(undefined, { maximumFractionDigits: 8 })}</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">{opened.toLocaleString()}</p>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[260px]">
                      {msgs[trade._id] && (
                        <div className={`rounded-xl px-3 py-2 text-xs font-semibold ${msgs[trade._id].ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                          {msgs[trade._id].text}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Profit ($)"
                          value={inputs[trade._id]?.profit || ''}
                          onChange={(e) => setInputs((prev) => ({ ...prev, [trade._id]: { ...prev[trade._id], profit: e.target.value } }))}
                          className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
                        />
                        <button
                          onClick={() => handleSet(trade._id, 'profit')}
                          disabled={saving[trade._id]}
                          className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 transition"
                        >
                          Set profit
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Loss ($)"
                          value={inputs[trade._id]?.loss || ''}
                          onChange={(e) => setInputs((prev) => ({ ...prev, [trade._id]: { ...prev[trade._id], loss: e.target.value } }))}
                          className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-rose-400"
                        />
                        <button
                          onClick={() => handleSet(trade._id, 'loss')}
                          disabled={saving[trade._id]}
                          className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-rose-400 disabled:bg-slate-700 disabled:text-slate-400 transition"
                        >
                          Set loss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTradesPage;
