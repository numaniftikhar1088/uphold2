import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import coinService from '../services/coinService';
import TradingViewChart from '../components/TradingViewChart';

const DashboardPage = () => {
  const { user } = useAuth();
  const [coins, setCoins]         = useState([]);
  const [search, setSearch]       = useState('');
  const [coinLoading, setCoinLoading] = useState(false);
  const [chartSymbol, setChartSymbol] = useState('BTCUSDT');
  const [chartInterval, setChartInterval] = useState('60');
  const [mobileTab, setMobileTab] = useState('All');

  const INTERVALS = [
    { label: '1m', value: '1' },
    { label: '5m', value: '5' },
    { label: '15m', value: '15' },
    { label: '1h', value: '60' },
    { label: '4h', value: '240' },
    { label: '1D', value: 'D' },
  ];

  useEffect(() => {
    const fetchCoins = async () => {
      setCoinLoading(true);
      try {
        const { coins: coinData } = await coinService.getAllCoins('', 100);
        setCoins(coinData);
      } catch (error) {
        console.error(error);
      } finally {
        setCoinLoading(false);
      }
    };
    fetchCoins();
  }, []);

  const filteredCoins = useMemo(() => {
    if (!search.trim()) return coins;
    const q = search.toUpperCase();
    return coins.filter((c) => c.symbol.includes(q) || c.name.toUpperCase().includes(q));
  }, [coins, search]);

  const topCoins = useMemo(() => {
    const targets = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
    return targets.map((sym) => coins.find((c) => c.symbol === sym)).filter(Boolean);
  }, [coins]);

  const mobileFilteredCoins = useMemo(() => {
    let list = filteredCoins;
    if (mobileTab === 'Gainers') list = list.filter((c) => c.priceChangePercent > 0);
    if (mobileTab === 'Losers') list = list.filter((c) => c.priceChangePercent < 0);
    return list;
  }, [filteredCoins, mobileTab]);

  const btc = coins.find((c) => c.symbol === 'BTCUSDT');
  const chartCoin = coins.find((c) => c.symbol === chartSymbol);

  return (
    <>
      {/* ── MOBILE LAYOUT ── */}
      <div className="block md:hidden bg-slate-950 min-h-screen text-slate-100">

        {/* Search bar */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 bg-slate-900 rounded-2xl px-4 py-2.5">
            <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search coins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder-slate-500"
            />
          </div>
        </div>

        {/* Hero banner */}
        <div className="mx-4 mt-1 rounded-3xl bg-gradient-to-br from-indigo-900 via-violet-900 to-cyan-900 p-5 shadow-xl animate-fade-in">
          <p className="text-lg font-extrabold text-white leading-tight">Trade crypto instantly &amp; securely</p>
          <p className="text-xs text-white/60 mt-1">Live markets · Instant deposits · Fast KYC</p>
          <div className="flex gap-2 mt-4">
            <Link to="/trade" className="px-4 py-1.5 bg-emerald-500 rounded-xl text-xs font-bold text-slate-950 hover:bg-emerald-400 transition">Trade Now</Link>
            <Link to="/market" className="px-4 py-1.5 bg-white/10 rounded-xl text-xs font-semibold text-white">View Markets</Link>
          </div>
        </div>

        {/* Top 3 price tickers */}
        {!coinLoading && topCoins.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mx-4 mt-4">
            {topCoins.map((coin, i) => (
              <div key={coin.symbol} style={{ animationDelay: `${i * 70}ms` }} className="bg-slate-900 rounded-2xl p-3 animate-fade-up hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/30 transition-all duration-200">
                <p className="text-[10px] text-slate-500 font-medium truncate">
                  {coin.symbol.replace('USDT', '')}/USDT
                </p>
                <p className="text-sm font-bold text-white mt-0.5">
                  ${coin.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className={`text-[10px] font-semibold mt-0.5 ${coin.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {coin.priceChangePercent >= 0 ? '+' : ''}{coin.priceChangePercent?.toFixed(2)}%
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Quick action circles */}
        <div className="flex justify-around mx-4 mt-5">
          {[
            {
              to: '/deposit', label: 'Deposit',
              color: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  {/* Arrow pointing down into tray — deposit */}
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v9M8 9l4 4 4-4M4 19h16" />
                </svg>
              ),
            },
            {
              to: '/withdraw', label: 'Withdraw',
              color: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  {/* Arrow pointing up from tray — withdraw */}
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V11m0 0l-4 4m4-4l4 4M4 5h16" />
                </svg>
              ),
            },
            {
              to: '/trade', label: 'Trade',
              color: 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              ),
            },
            {
              to: '/chat', label: 'Support',
              color: 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              ),
            },
          ].map((action, i) => (
            <Link key={action.to} to={action.to} style={{ animationDelay: `${i * 60}ms` }} className="flex flex-col items-center gap-1.5 animate-fade-up">
              <div className={`w-14 h-14 rounded-full ${action.color} flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95`}>
                {action.icon}
              </div>
              <span className="text-[11px] text-slate-400 font-medium">{action.label}</span>
            </Link>
          ))}
        </div>

        {/* Balance summary */}
        <div className="mx-4 mt-4 bg-slate-900 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">My Balance</p>
            <p className="text-lg font-bold text-white">${user?.balance?.toFixed(2)}</p>
          </div>
          <Link to="/deposit" className="text-xs bg-emerald-500 text-slate-950 font-semibold px-3 py-1.5 rounded-xl hover:bg-emerald-400 transition inline-flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v9M8 9l4 4 4-4" />
            </svg>
            Top Up
          </Link>
        </div>

        {/* Market list */}
        <div className="mx-4 mt-5">
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-3">
            {['All', 'Gainers', 'Losers'].map((tab) => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  mobileTab === tab ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Table header */}
          <div className="flex items-center justify-between px-1 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider">
            <span className="w-2/5">Name</span>
            <span className="w-1/3 text-right">Price</span>
            <span className="w-1/4 text-right">24h</span>
          </div>

          {/* Rows */}
          {coinLoading ? (
            <div className="text-center py-8 text-slate-500 text-sm">Loading...</div>
          ) : (
            mobileFilteredCoins.slice(0, 30).map((coin) => (
              <button
                key={coin.symbol}
                onClick={() => setChartSymbol(coin.symbol)}
                className="w-full flex items-center justify-between py-3 border-b border-slate-800/60"
              >
                <div className="flex items-center gap-2 text-left w-2/5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/40 to-violet-500/40 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                    {coin.symbol.replace('USDT', '').slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {coin.symbol.replace('USDT', '')}/USDT
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-200 w-1/3 text-right">
                  ${coin.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </p>
                <div className="w-1/4 flex justify-end">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${
                    coin.priceChangePercent >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {coin.priceChangePercent >= 0 ? '+' : ''}{coin.priceChangePercent?.toFixed(2)}%
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden md:block min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6">
        <div className="mx-auto max-w-[1400px] space-y-6">

          {/* Hero */}
          <header className="overflow-hidden rounded-3xl bg-slate-900/80 px-8 py-7 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-center">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Uphold</p>
                <h1 className="text-4xl font-extrabold tracking-tight text-white">
                  Modern crypto insights + instant trade access
                </h1>
                <p className="max-w-xl text-base text-slate-400">
                  Monitor live markets, manage your wallet, and jump into orders from the same unified dashboard.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/trade" className="rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
                    Open Trading Terminal
                  </Link>
                  <Link to="/market" className="rounded-2xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-white">
                    View All Markets
                  </Link>
                  <Link to="/deposit" className="rounded-2xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-white">
                    Deposit Funds
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-slate-950/90 via-slate-900 to-cyan-950/80 p-5 shadow-2xl shadow-cyan-500/10 ring-1 ring-white/10">
                <div className="mb-4 flex items-center justify-between text-slate-300">
                  <span className="text-xs uppercase tracking-[0.25em]">Quick trade</span>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-widest text-slate-300">Live</span>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-900/80 p-4 ring-1 ring-white/5 hover:ring-white/10 transition-all duration-200">
                    <p className="text-xs text-slate-400">Top pair</p>
                    <p className="mt-1 text-2xl font-bold text-white">BTC/USDT</p>
                    {btc && (
                      <p className={`mt-0.5 text-sm font-semibold ${btc.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${btc.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        {' '}({btc.priceChangePercent >= 0 ? '+' : ''}{btc.priceChangePercent?.toFixed(2)}%)
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl bg-slate-900/80 p-4 ring-1 ring-white/5 hover:ring-white/10 transition-all duration-200">
                    <p className="text-xs text-slate-400">Available balance</p>
                    <p className="mt-1 text-2xl font-bold text-white">${user?.balance?.toFixed(2)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link to="/trade" className="rounded-2xl bg-green-500 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-green-400">Buy BTC</Link>
                    <Link to="/trade" className="rounded-2xl bg-red-500 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-red-400">Sell BTC</Link>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Profile | Market | Chart */}
          <section className="grid gap-6 xl:grid-cols-[300px_280px_1fr]">

            {/* Account overview */}
            <div className="rounded-3xl bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20">
              <h2 className="text-base font-semibold text-white">Account overview</h2>
              <div className="mt-4 space-y-3 text-slate-300">
                <div className="rounded-2xl bg-slate-950/80 p-4 ring-1 ring-white/5">
                  <p className="text-xs text-slate-400">Username</p>
                  <p className="mt-1 font-semibold text-white truncate">{user?.name}</p>
                  <div className="mt-2">
                    {{
                      verified:      <span className="px-2 py-0.5 text-xs border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 rounded-lg font-medium">Verified</span>,
                      pending:       <span className="px-2 py-0.5 text-xs border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 rounded-lg font-medium">Pending</span>,
                      rejected:      <span className="px-2 py-0.5 text-xs border border-rose-400/30 bg-rose-400/10 text-rose-400 rounded-lg font-medium">Rejected</span>,
                      not_submitted: <span className="px-2 py-0.5 text-xs border border-slate-600 bg-slate-800 text-slate-400 rounded-lg font-medium">Not Submitted</span>,
                    }[user?.kycStatus] ?? <span className="px-2 py-0.5 text-xs border border-slate-600 bg-slate-800 text-slate-400 rounded-lg font-medium">Not Submitted</span>}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-950/80 p-4 ring-1 ring-white/5">
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="mt-1 font-semibold text-white truncate">{user?.email}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/80 p-4 ring-1 ring-white/5">
                  <p className="text-xs text-slate-400">Balance</p>
                  <p className="mt-1 text-xl font-bold text-white">${user?.balance?.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Market watch */}
            <div className="rounded-3xl bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-white">Market watch</h2>
                <Link to="/market" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition">
                  View all →
                </Link>
              </div>
              <input
                type="search"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400 mb-3"
              />
              <div className="flex-1 overflow-y-auto max-h-[480px] rounded-2xl border border-slate-800 bg-slate-950/80">
                <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
                  <thead className="sticky top-0 bg-slate-900 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2">Coin</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">24h</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {coinLoading ? (
                      <tr><td colSpan="3" className="px-3 py-6 text-center text-slate-400">Loading...</td></tr>
                    ) : filteredCoins.slice(0, 30).map((coin) => (
                      <tr
                        key={coin.symbol}
                        onClick={() => setChartSymbol(coin.symbol)}
                        className={`cursor-pointer transition ${chartSymbol === coin.symbol ? 'bg-cyan-500/10' : 'hover:bg-slate-800/60'}`}
                      >
                        <td className="px-3 py-2">
                          <div className={`text-xs font-semibold ${chartSymbol === coin.symbol ? 'text-cyan-300' : 'text-slate-100'}`}>{coin.symbol}</div>
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-200">
                          ${coin.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </td>
                        <td className={`px-3 py-2 text-xs font-semibold ${coin.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {coin.priceChangePercent >= 0 ? '+' : ''}{coin.priceChangePercent?.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live chart */}
            <div className="rounded-3xl bg-slate-900/80 p-5 shadow-lg ring-1 ring-white/5 flex flex-col">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold text-white">{chartSymbol}</span>
                {chartCoin && (
                  <span className={`text-sm font-semibold ${chartCoin.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${chartCoin.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                    {' '}({chartCoin.priceChangePercent >= 0 ? '+' : ''}{chartCoin.priceChangePercent?.toFixed(2)}%)
                  </span>
                )}
                <div className="ml-auto flex gap-1">
                  {INTERVALS.map((iv) => (
                    <button
                      key={iv.value}
                      onClick={() => setChartInterval(iv.value)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${chartInterval === iv.value ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                      {iv.label}
                    </button>
                  ))}
                </div>
                <Link to="/trade" className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition inline-flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4" />
                  </svg>
                  Trade
                </Link>
              </div>
              <div className="flex-1">
                <TradingViewChart symbol={chartSymbol} interval={chartInterval} height={460} />
              </div>
            </div>
          </section>

          {/* Feature cards */}
          <section className="grid gap-6 md:grid-cols-3">
            {[
              { img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop&crop=center', alt: 'Analytics', title: 'Advanced Analytics', desc: 'Deep market insights and trend analysis' },
              { img: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop&crop=center', alt: 'Trading', title: 'Smart Trading', desc: 'Instant buy/sell with live TradingView charts' },
              { img: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=300&fit=crop&crop=center', alt: 'Portfolio', title: 'Portfolio Insights', desc: 'Comprehensive trade history and balance tracking' },
            ].map((card, i) => (
              <div key={card.title} style={{ animationDelay: `${i * 90}ms` }} className="relative overflow-hidden rounded-3xl bg-slate-900/80 p-6 shadow-lg animate-fade-up hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 transition-all duration-200 group">
                <div className="overflow-hidden rounded-2xl">
                  <img src={card.img} alt={card.alt} className="w-full h-40 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-semibold text-white">{card.title}</h3>
                  <p className="text-sm text-slate-400">{card.desc}</p>
                </div>
              </div>
            ))}
          </section>

        </div>
      </div>
    </>
  );
};

export default DashboardPage;
