import api from './api';

const executeTrade = async ({ symbol, side, amount, entryPrice, duration, type }) => {
  const { data } = await api.post('/trades', { symbol, side, amount, entryPrice, duration, type });
  return data;
};

const getMyTrades = async () => {
  const { data } = await api.get('/trades/me');
  return data;
};

const getAdminTrades = async () => {
  const { data } = await api.get('/trades/admin');
  return data;
};

const getPendingTrades = async () => {
  const { data } = await api.get('/trades/admin/pending');
  return data;
};

const setTradeResult = async (tradeId, payload) => {
  const { data } = await api.put(`/trades/${tradeId}/result`, payload);
  return data;
};

const cancelTrade = async (tradeId) => {
  const { data } = await api.delete(`/trades/${tradeId}/cancel`);
  return data;
};

export default {
  executeTrade,
  getMyTrades,
  getAdminTrades,
  getPendingTrades,
  setTradeResult,
  cancelTrade,
};