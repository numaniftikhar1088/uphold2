import api from './api';

const getCandles = async ({ symbol = 'BTCUSDT', interval = '1h', limit = 50 } = {}) => {
  try {
    console.log('chartService: requesting candles', { apiBaseUrl: api.defaults.baseURL, symbol, interval, limit });
    const { data } = await api.get('/charts/candles', {
      params: { symbol, interval, limit },
    });
    return data;
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      throw new Error('Chart request timed out. Please try again.');
    }
    if (!err.response) {
      throw new Error('Unable to reach the server for chart data.');
    }
    throw err;
  }
};

export default {
  getCandles,
};
