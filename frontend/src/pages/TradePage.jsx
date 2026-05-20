import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import coinService from '../services/coinService';
import tradeService from '../services/tradeService';
import TradingViewChart from '../components/TradingViewChart';

/* ─── Multiplier options (trade duration in seconds) ────────────────────── */
const MULTIPLIER_OPTIONS = [
  { label: '30s',  value: 30  },
  { label: '60s',  value: 60  },
  { label: '90s',  value: 90  },
  { label: '120s', value: 120 },
  { label: '150s', value: 150 },
  { label: '180s', value: 180 },
];

const CHART_INTERVALS = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '1h', value: '60' },
  { label: '4h', value: '240' },
  { label: '1D', value: 'D' },
];

/* ─── Live Order Book ────────────────────────────────────────────────────── */
const OrderBook = ({ symbol }) => {
  const [asks, setAsks] = useState([]);
  const [bids, setBids] = useState([]);
  const [midPrice, setMidPrice] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=8`
        );
        if (!res.ok || !mounted) return;
        const data = await res.json();
        if (!mounted) return;
        setAsks(data.asks || []);
        setBids(data.bids || []);
        if (data.asks?.[0] && data.bids?.[0]) {
          setMidPrice((parseFloat(data.asks[0][0]) + parseFloat(data.bids[0][0])) / 2);
        }
      } catch (_) { /* silent — Binance may be blocked in some regions */ }
    };

    load();
    const id = setInterval(load, 2000);
    return () => { mounted = false; clearInterval(id); };
  }, [symbol]);

  const fmtPrice = (n) => parseFloat(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  const fmtVol   = (n) => parseFloat(n).toFixed(4);

  return (
    <div className="rounded-3xl bg-[#0D1421] ring-1 ring-white/[0.06] p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Order Book</h3>
        <span className="text-[10px] text-slate-600 font-mono">{symbol}</span>
      </div>

      {/* Column headers */}
      <div className="flex justify-between text-[10px] text-slate-600 uppercase tracking-wider mb-1.5 px-1">
        <span>Price</span>
        <span>Volume</span>
      </div>

      {/* Asks — reversed so lowest ask is nearest mid price */}
      <div className="space-y-[3px] mb-2">
        {[...asks].slice(0, 6).reverse().map(([price, vol], i) => (
          <div key={i} className="flex justify-between text-xs px-1 py-[3px] rounded-lg hover:bg-red-500/5 transition-colors relative overflow-hidden">
            <div
              className="absolute inset-y-0 right-0 bg-red-500/8 rounded-lg"
              style={{ width: `${Math.min(parseFloat(vol) * 40, 90)}%` }}
            />
            <span className="relative font-mono text-red-400">{fmtPrice(price)}</span>
            <span className="relative font-mono text-slate-500">{fmtVol(vol)}</span>
          </div>
        ))}
      </div>

      {/* Mid / last price */}
      <div className="flex items-center justify-center gap-2 py-2 my-1 rounded-xl bg-slate-800/50 border border-slate-700/30">
        {midPrice ? (
          <>
            <span className="text-sm font-bold text-white font-mono">{fmtPrice(midPrice)}</span>
            <span className="text-[10px] text-slate-500">USDT</span>
          </>
        ) : (
          <span className="text-xs text-slate-600">Loading...</span>
        )}
      </div>

      {/* Bids */}
      <div className="space-y-[3px] mt-2">
        {bids.slice(0, 6).map(([price, vol], i) => (
          <div key={i} className="flex justify-between text-xs px-1 py-[3px] rounded-lg hover:bg-green-500/5 transition-colors relative overflow-hidden">
            <div
              className="absolute inset-y-0 right-0 bg-green-500/8 rounded-lg"
              style={{ width: `${Math.min(parseFloat(vol) * 40, 90)}%` }}
            />
            <span className="relative font-mono text-green-400">{fmtPrice(price)}</span>
            <span className="relative font-mono text-slate-500">{fmtVol(vol)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Main TradePage ─────────────────────────────────────────────────────── */
const TradePage = () => {
  const { user, updateUser, tradeUpdate } = useAuth();

  const [coins, setCoins]           = useState([]);
  const [symbol, setSymbol]         = useState('BTCUSDT');
  const [side, setSide]             = useState('buy');       // 'buy' = Up, 'sell' = Down
  const [amount, setAmount]         = useState('');
  const [duration, setDuration]     = useState(60);          // selected multiplier (seconds)
  const [coinSearch, setCoinSearch] = useState('');
  const [chartInterval, setChartInterval] = useState('60');

  const [showCoinPicker, setShowCoinPicker] = useState(false);

  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [trades, setTrades]         = useState([]);
  const [activeTrade, setActiveTrade] = useState(null);
  const [countdown, setCountdown]   = useState(0);
  const countdownRef                = useRef(null);

  /* ── Load coins + trade history ── */
  useEffect(() => {
    (async () => {
      try {
        const [{ coins: coinList }, { trades: myTrades }] = await Promise.all([
          coinService.getAllCoins('', 200),
          tradeService.getMyTrades(),
        ]);
        setCoins(coinList);
        setTrades(myTrades);

        // Restore active trade from server (recalculate remaining time)
        const pending = myTrades.find(
          (t) => t.status === 'pending' && t.amount > 0 && !(t.profit > 0) && !(t.loss > 0)
        );
        if (pending) {
          const dur = pending.duration || 60;
          const elapsed = Math.floor(
            (Date.now() - new Date(pending.openedAt || pending.createdAt).getTime()) / 1000
          );
          if (elapsed < dur) setActiveTrade(pending);
          // else: trade time already expired client-side — leave form unlocked
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  /* ── Real-time trade result from admin ── */
  useEffect(() => {
    if (!tradeUpdate) return;
    setTrades((prev) => prev.map((t) =>
      t._id === tradeUpdate._id ? { ...t, ...tradeUpdate } : t
    ));
    if (activeTrade?._id === tradeUpdate._id) {
      // Stop countdown
      if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
      setActiveTrade(null);
      setCountdown(0);
      const msg = tradeUpdate.profit > 0
        ? `Trade closed — Profit: +$${Number(tradeUpdate.profit).toFixed(2)}`
        : `Trade closed — Loss: -$${Number(tradeUpdate.loss).toFixed(2)}`;
      setSuccess(msg);
    }
  }, [tradeUpdate]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Countdown timer (runs from selected duration down to 0) ── */
  useEffect(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }

    if (!activeTrade) { setCountdown(0); return; }

    const dur = activeTrade.duration || 60;
    const openedMs = new Date(activeTrade.openedAt || activeTrade.createdAt).getTime();
    const remaining = Math.max(dur - Math.floor((Date.now() - openedMs) / 1000), 0);

    setCountdown(remaining);
    if (remaining === 0) { setActiveTrade(null); return; }

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; } };
  }, [activeTrade?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── When countdown hits 0: release trade lock so user can open new trade ── */
  useEffect(() => {
    if (countdown === 0 && activeTrade) setActiveTrade(null);
  }, [countdown]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredCoins = useMemo(() => {
    if (!coinSearch.trim()) return coins;
    const q = coinSearch.toUpperCase();
    return coins.filter((c) => c.symbol.includes(q) || c.name.toUpperCase().includes(q));
  }, [coins, coinSearch]);

  const selectedCoin = useMemo(
    () => coins.find((c) => c.symbol === symbol) || null,
    [coins, symbol]
  );

  /* ── Submit trade ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const a = parseFloat(amount);
    if (!a || a <= 0) { setError('Enter a valid amount.'); return; }

    setLoading(true);
    try {
      const { trade, balance } = await tradeService.executeTrade({
        symbol,
        side,
        amount: a,
        entryPrice: selectedCoin?.price || null,
        duration,
      });
      setTrades((prev) => [trade, ...prev]);
      setActiveTrade(trade);
      setAmount('');
      updateUser({ ...user, balance });
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to open trade. Try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Cancel trade ── */
  const handleCancel = async () => {
    if (!activeTrade) return;
    try {
      const { balance } = await tradeService.cancelTrade(activeTrade._id);
      if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
      setActiveTrade(null);
      setCountdown(0);
      setTrades((prev) => prev.map((t) =>
        t._id === activeTrade._id ? { ...t, status: 'closed', closedAt: new Date() } : t
      ));
      updateUser({ ...user, balance });
      setSuccess('Trade cancelled. Your amount has been returned.');
    } catch {
      setError('Failed to cancel trade.');
    }
  };

  const progressPct = activeTrade ? (countdown / (activeTrade.duration || 60)) * 100 : 0;

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <div className="min-h-screen bg-[#070B12] px-3 py-5 text-slate-100 md:px-5 md:py-7">
      <div className="mx-auto max-w-7xl space-y-4">

        {/* ── Page header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Trading Terminal</p>
            <h1 className="mt-0.5 text-xl font-bold text-white">Live Trading</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-800/60 px-4 py-2.5 text-center">
              <p className="text-[10px] text-slate-500">Balance</p>
              <p className="text-lg font-bold text-white">${user?.balance?.toFixed(2)}</p>
            </div>
            <Link to="/deposit"
              className="rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-400 transition inline-flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v9M8 9l4 4 4-4M4 19h16" />
              </svg>
              Add Funds
            </Link>
          </div>
        </div>

        {/* ── Collapsible Coin Picker ── */}
        <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] overflow-hidden">
          {/* Always-visible header row */}
          <button
            onClick={() => setShowCoinPicker((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Trading Pair</span>
              <span className="text-sm font-bold text-white">
                {symbol.replace('USDT', '')}<span className="text-slate-500">/USDT</span>
              </span>
              {selectedCoin && (
                <span className={`text-xs font-semibold ${selectedCoin.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${selectedCoin.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  {' '}({selectedCoin.priceChangePercent >= 0 ? '+' : ''}{selectedCoin.priceChangePercent?.toFixed(2)}%)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">{showCoinPicker ? 'Collapse' : 'Change pair'}</span>
              <svg
                className={`w-4 h-4 text-slate-500 transition-transform ${showCoinPicker ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Expandable coin list */}
          {showCoinPicker && (
            <div className="px-3 pb-3 border-t border-slate-800/60">
              <input
                type="search"
                placeholder="Search coins..."
                value={coinSearch}
                onChange={(e) => setCoinSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500 mt-3 mb-2"
                autoFocus
              />
              <div className="overflow-y-auto max-h-48 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
                {filteredCoins.slice(0, 80).map((coin) => (
                  <button
                    key={coin.symbol}
                    onClick={() => { setSymbol(coin.symbol); setCoinSearch(''); setShowCoinPicker(false); }}
                    className={`flex flex-col items-start rounded-xl px-2.5 py-2 text-xs transition ${
                      symbol === coin.symbol
                        ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <span className="font-semibold">{coin.symbol.replace('USDT', '')}/USDT</span>
                    <span className={`font-mono text-[10px] mt-0.5 ${coin.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {coin.priceChangePercent >= 0 ? '+' : ''}{coin.priceChangePercent?.toFixed(2)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Chart ── */}
        <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-white">{symbol}</span>
            {selectedCoin && (
              <span className={`text-xs font-semibold ${selectedCoin.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${selectedCoin.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                {' '}({selectedCoin.priceChangePercent >= 0 ? '+' : ''}{selectedCoin.priceChangePercent?.toFixed(2)}%)
              </span>
            )}
            <div className="ml-auto flex gap-1">
              {CHART_INTERVALS.map((iv) => (
                <button
                  key={iv.value}
                  onClick={() => setChartInterval(iv.value)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    chartInterval === iv.value
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {iv.label}
                </button>
              ))}
            </div>
          </div>
          <TradingViewChart symbol={symbol} interval={chartInterval} height={400} />
        </div>

        {/* ── Trade Form + Order Book (side by side on both mobile and desktop) ── */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">

          {/* ── Order Form ── */}
          <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] p-3 md:p-5 flex flex-col gap-3">

            {/* Up / Down selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide('buy')}
                className={`rounded-xl py-2.5 md:py-3 text-sm font-bold transition ${
                  side === 'buy'
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700'
                }`}
              >
                ▲ Up
              </button>
              <button
                type="button"
                onClick={() => setSide('sell')}
                className={`rounded-xl py-2.5 md:py-3 text-sm font-bold transition ${
                  side === 'sell'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700'
                }`}
              >
                ▼ Down
              </button>
            </div>

            {/* Active trade banner */}
            {activeTrade && (
              <div className="rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20 px-3 py-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase text-amber-400">
                    {activeTrade.side === 'buy' ? '▲ Up' : '▼ Down'} · {activeTrade.symbol}
                  </span>
                  <span className="text-xs font-bold text-amber-300">${activeTrade.amount?.toFixed(2)}</span>
                </div>
                {/* Countdown progress bar */}
                <div className="h-1.5 w-full rounded-full bg-slate-700 overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${progressPct}%`,
                      background: progressPct > 50 ? '#22c55e' : progressPct > 20 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    {countdown > 0 ? `${countdown}s remaining` : 'Pending result...'}
                  </span>
                  <button
                    onClick={handleCancel}
                    className="text-[10px] font-semibold text-red-400 hover:text-red-300 transition bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            {error   && <div className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}
            {success && <div className="rounded-xl bg-green-500/10 px-3 py-2 text-xs text-green-400">{success}</div>}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">

              {/* Amount input */}
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Opening Amount (USD)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full rounded-xl border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500 placeholder-slate-600"
                />
              </div>

              {/* Multiplier dropdown */}
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Multiplier</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {MULTIPLIER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDuration(opt.value)}
                      className={`rounded-xl py-2 text-xs font-semibold transition ${
                        duration === opt.value
                          ? side === 'buy'
                            ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/40'
                            : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40'
                          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary row */}
              <div className="rounded-xl bg-slate-800/30 px-3 py-2 text-xs flex justify-between text-slate-400">
                <span>Invest</span>
                <span className="text-white font-semibold">${parseFloat(amount) > 0 ? parseFloat(amount).toFixed(2) : '0.00'}</span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !!activeTrade}
                className={`w-full rounded-xl py-3 text-sm font-bold transition ${
                  side === 'buy'
                    ? 'bg-green-500 hover:bg-green-400 shadow-lg shadow-green-500/20'
                    : 'bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/20'
                } text-white disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {loading
                  ? 'Opening...'
                  : activeTrade
                    ? 'Trade Active'
                    : `${side === 'buy' ? '▲ Up' : '▼ Down'} · ${duration}s`}
              </button>
            </form>

            {/* Entry price info */}
            {selectedCoin && (
              <div className="text-[10px] text-slate-600 flex justify-between px-1">
                <span>Entry price</span>
                <span className="font-mono">${selectedCoin.price?.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
              </div>
            )}
          </div>

          {/* ── Order Book ── */}
          <OrderBook symbol={symbol} />
        </div>

        {/* ── Trade History ── */}
        <section className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-white">Trade History</h2>
          {trades.length === 0 ? (
            <p className="text-sm text-slate-500">No trades yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-slate-300">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-slate-600 border-b border-slate-800">
                    <th className="pb-2 pr-4">Symbol</th>
                    <th className="pb-2 pr-4">Direction</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2 pr-4">Duration</th>
                    <th className="pb-2 pr-4">Result</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Opened</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {trades.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-2.5 pr-4 font-semibold text-white">{t.symbol}</td>
                      <td className={`py-2.5 pr-4 font-bold ${t.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                        {t.side === 'buy' ? '▲ Up' : '▼ Down'}
                      </td>
                      <td className="py-2.5 pr-4 font-mono">${(t.amount ?? t.total)?.toFixed(2)}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{t.duration ? `${t.duration}s` : '—'}</td>
                      <td className="py-2.5 pr-4">
                        {t.profit > 0 && <span className="text-green-400 font-semibold">+${t.profit.toFixed(2)}</span>}
                        {t.loss   > 0 && <span className="text-red-400 font-semibold">-${t.loss.toFixed(2)}</span>}
                        {!(t.profit > 0) && !(t.loss > 0) && <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          t.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700/60 text-slate-400'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-600 text-[10px]">
                        {new Date(t.openedAt || t.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default TradePage;
