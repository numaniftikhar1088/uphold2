import api from './api';

// Fetch directly from Binance — same approach as OrderBook, no backend bottleneck.
// Three mirrors tried in order; 60-second client-side cache; duplicate requests deduplicated.
const BINANCE_MIRRORS = [
  'https://api.binance.com/api/v3/ticker/24hr',
  'https://api1.binance.com/api/v3/ticker/24hr',
  'https://api2.binance.com/api/v3/ticker/24hr',
];

let _cache = null;
let _cacheAt = 0;
let _inflight = null;
const CACHE_TTL = 60_000;

const fetchAllTickers = () => {
  const now = Date.now();
  if (_cache && now - _cacheAt < CACHE_TTL) return Promise.resolve(_cache);
  if (_inflight) return _inflight;

  _inflight = (async () => {
    for (const url of BINANCE_MIRRORS) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) continue;
        const data = await res.json();
        _cache = data;
        _cacheAt = Date.now();
        return data;
      } catch { /* try next mirror */ }
    }
    return _cache ?? []; // stale cache or empty on total failure
  })().finally(() => { _inflight = null; });

  return _inflight;
};

const mapTicker = (t) => ({
  symbol: t.symbol,
  name: t.symbol.replace('USDT', ''),
  price: parseFloat(t.lastPrice),
  priceChangePercent: parseFloat(t.priceChangePercent),
  volume: parseFloat(t.quoteVolume),
  highPrice: parseFloat(t.highPrice),
  lowPrice: parseFloat(t.lowPrice),
});

// Kept for dashboard (uses backend for 5 named coins with human-readable names)
const getCoins = async (symbols = []) => {
  const params = symbols.length ? { symbols: symbols.join(',') } : {};
  const { data } = await api.get('/coins', { params });
  return data;
};

// Primary: fetches directly from Binance (fast, cached).
// Fallback: backend /api/coins/all if Binance is unreachable from this browser.
const getAllCoins = async (search = '', limit = 100) => {
  try {
    const allTickers = await fetchAllTickers();
    if (!allTickers.length) throw new Error('empty');

    let pairs = allTickers
      .filter((t) => t.symbol.endsWith('USDT') && parseFloat(t.lastPrice) > 0)
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));

    if (search) {
      const q = search.toUpperCase();
      pairs = pairs.filter((t) => t.symbol.includes(q));
    }

    return { coins: pairs.slice(0, limit).map(mapTicker), total: pairs.length };
  } catch {
    // Backend fallback
    const params = {};
    if (search) params.search = search;
    if (limit)  params.limit  = limit;
    const { data } = await api.get('/coins/all', { params });
    return data;
  }
};

export default { getCoins, getAllCoins };
