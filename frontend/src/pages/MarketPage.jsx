import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import coinService from '../services/coinService';

const MarketPage = () => {
  const [coins, setCoins]     = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    let cancelled = false;
    coinService.getAllCoins('', 200)
      .then(({ coins: list }) => { if (!cancelled) setCoins(list); })
      .catch(() => { if (!cancelled) setError('Failed to load market data.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return coins;
    const q = search.toUpperCase();
    return coins.filter((c) => c.symbol.includes(q) || c.name.toUpperCase().includes(q));
  }, [coins, search]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">

        <header className="rounded-3xl bg-slate-900/80 px-8 py-6 shadow-xl shadow-slate-950/30 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-300/70">Live prices</p>
            <h1 className="mt-1 text-3xl font-bold text-white">Market</h1>
          </div>
          <Link
            to="/trade"
            className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition self-start sm:self-auto"
          >
            Open trading terminal
          </Link>
        </header>

        <div className="rounded-3xl bg-slate-900/80 p-6 shadow-lg ring-1 ring-white/5">
          <input
            type="search"
            placeholder="Search coins by name or symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
          />

          <div className="mt-4 text-xs text-slate-500">
            {loading ? 'Loading...' : `${filtered.length} coins`}
          </div>

          {error && (
            <div className="mt-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm text-slate-300">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  <th className="pb-3 pr-6">#</th>
                  <th className="pb-3 pr-6">Coin</th>
                  <th className="pb-3 pr-6">Price</th>
                  <th className="pb-3 pr-6">24h %</th>
                  <th className="pb-3 pr-6">24h Volume</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">Fetching market data...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">No coins found.</td>
                  </tr>
                ) : (
                  filtered.map((coin, i) => (
                    <tr key={coin.symbol} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 pr-6 text-slate-500">{i + 1}</td>
                      <td className="py-3 pr-6">
                        <div className="font-semibold text-white">{coin.symbol}</div>
                        <div className="text-xs text-slate-500">{coin.name}</div>
                      </td>
                      <td className="py-3 pr-6 font-medium text-white">
                        ${coin.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                      </td>
                      <td className={`py-3 pr-6 font-semibold ${coin.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {coin.priceChangePercent >= 0 ? '+' : ''}{coin.priceChangePercent?.toFixed(2)}%
                      </td>
                      <td className="py-3 pr-6 text-slate-400">
                        ${Number(coin.volume).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3">
                        <Link
                          to="/trade"
                          state={{ symbol: coin.symbol }}
                          className="rounded-xl bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                        >
                          Trade
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketPage;
