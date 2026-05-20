const axios = require('axios');

const getCandles = async (req, res, next) => {
  try {
    console.log('[chart] incoming request', { query: req.query, ip: req.ip });
    const symbol = (req.query.symbol || 'BTCUSDT').toUpperCase();
    const interval = req.query.interval || '1h';
    const limit = Number(req.query.limit) || 50;

    const endpoints = [
      'https://api.binance.com/api/v3/klines',
      'https://api1.binance.com/api/v3/klines',
      'https://fapi.binance.com/api/v3/klines',
    ];

    let response;
    let lastError;
    for (const endpoint of endpoints) {
      try {
        response = await axios.get(endpoint, {
          params: { symbol, interval, limit },
          timeout: 15000,
        });
        if (response?.data) break;
      } catch (error) {
        lastError = error;
        console.warn(`Binance chart fetch failed for ${endpoint}:`, error.message);
      }
    }

    if (!response || !response.data) {
      throw lastError || new Error('Unable to fetch chart data');
    }

    const candles = response.data.map((item) => ({
      time: item[0],
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseFloat(item[5]),
    }));

    res.json({ symbol, interval, candles });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCandles };
