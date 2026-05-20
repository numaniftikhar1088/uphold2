const axios = require('axios');
const { setPrice } = require('../utils/priceCache');

const BINANCE_URLS = [
  'https://api.binance.com/api/v3/ticker/24hr',
  'https://api1.binance.com/api/v3/ticker/24hr',
  'https://api2.binance.com/api/v3/ticker/24hr',
];

const defaultSymbols = [
  { symbol: 'BTCUSDT', name: 'Bitcoin' },
  { symbol: 'ETHUSDT', name: 'Ethereum' },
  { symbol: 'BNBUSDT', name: 'Binance Coin' },
  { symbol: 'ADAUSDT', name: 'Cardano' },
  { symbol: 'XRPUSDT', name: 'Ripple' },
];

// In-memory cache — shared across all requests
let _tickerCache = null;
let _tickerCacheAt = 0;
let _tickerInflight = null;
const CACHE_TTL = 300_000; // 5 minutes

// Fetch ALL tickers once; return cached copy on subsequent calls within TTL.
// _tickerInflight prevents duplicate in-flight requests (thundering herd).
const fetchAllTickers = async () => {
  const now = Date.now();
  if (_tickerCache && (now - _tickerCacheAt) < CACHE_TTL) return _tickerCache;

  if (!_tickerInflight) {
    _tickerInflight = (async () => {
      for (const url of BINANCE_URLS) {
        try {
          const { data } = await axios.get(url, { timeout: 10000 });
          _tickerCache = data;
          _tickerCacheAt = Date.now();
          return data;
        } catch {
          // try next mirror
        }
      }
      return _tickerCache || []; // return stale cache on total failure
    })().finally(() => { _tickerInflight = null; });
  }

  return _tickerInflight;
};

const fetch24hr = async (symbol) => {
  // Reuse the cached all-tickers to avoid extra Binance calls
  const all = await fetchAllTickers();
  const ticker = all.find((t) => t.symbol === symbol);
  if (ticker) return ticker;

  // Fallback: direct single-symbol call
  for (const url of BINANCE_URLS) {
    try {
      const { data } = await axios.get(url, { params: { symbol }, timeout: 5000 });
      return data;
    } catch {
      // try next URL
    }
  }
  return null;
};

// GET /api/coins — default 5 coins (used by dashboard)
const getCoins = async (req, res, next) => {
  try {
    const symbols = req.query.symbols
      ? req.query.symbols.split(',').map((s) => s.trim().toUpperCase())
      : defaultSymbols.map((c) => c.symbol);

    const results = await Promise.all(symbols.map((s) => fetch24hr(s)));

    const coins = results.map((data, i) => {
      const symbol = symbols[i];
      if (data) {
        const price = parseFloat(data.lastPrice);
        setPrice(symbol, price);
        return {
          symbol: data.symbol,
          name: defaultSymbols.find((c) => c.symbol === data.symbol)?.name || data.symbol,
          price,
          priceChangePercent: parseFloat(data.priceChangePercent),
          volume: parseFloat(data.volume),
          highPrice: parseFloat(data.highPrice),
          lowPrice: parseFloat(data.lowPrice),
        };
      }
      return {
        symbol,
        name: defaultSymbols.find((c) => c.symbol === symbol)?.name || symbol,
        price: 0, priceChangePercent: 0, volume: 0, highPrice: 0, lowPrice: 0,
        error: 'Unable to fetch ticker',
      };
    });

    res.json({ coins });
  } catch (error) {
    next(error);
  }
};

// GET /api/coins/all?search=btc&limit=100 — all USDT pairs with optional search
const getAllCoins = async (req, res, next) => {
  try {
    const search = (req.query.search || '').toUpperCase().trim();
    const limit  = Math.min(parseInt(req.query.limit) || 100, 500);

    const allTickers = await fetchAllTickers();

    let usdtPairs = allTickers
      .filter((t) => t.symbol.endsWith('USDT') && parseFloat(t.lastPrice) > 0)
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));

    if (search) {
      usdtPairs = usdtPairs.filter((t) => t.symbol.includes(search));
    }

    const coins = usdtPairs.slice(0, limit).map((t) => {
      const price = parseFloat(t.lastPrice);
      setPrice(t.symbol, price);
      return {
        symbol: t.symbol,
        name: t.symbol.replace('USDT', ''),
        price,
        priceChangePercent: parseFloat(t.priceChangePercent),
        volume: parseFloat(t.quoteVolume),
        highPrice: parseFloat(t.highPrice),
        lowPrice: parseFloat(t.lowPrice),
      };
    });

    res.json({ coins, total: usdtPairs.length });
  } catch (error) {
    next(error);
  }
};

// Pre-warm cache on startup so the first request is instant
fetchAllTickers().catch(() => {});

module.exports = { getCoins, getAllCoins };
