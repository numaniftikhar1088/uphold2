import api from './api';

const createDeposit = async (amount, chain, transferAddress, transactionId, certificate, transactionPassword) => {
  const { data } = await api.post('/requests/deposits', { amount, chain, transferAddress, transactionId, certificate, transactionPassword });
  return data;
};

const createWithdraw = async (amount, chain, withdrawalAddress, transactionPassword) => {
  const { data } = await api.post('/requests/withdraws', { amount, chain, withdrawalAddress, transactionPassword });
  return data;
};

const createBankWithdraw = async (amount, bankAccountId, transactionPassword) => {
  const { data } = await api.post('/requests/withdraws', { amount, withdrawMethod: 'bank', bankAccountId, transactionPassword });
  return data;
};

const getMyDeposits = async () => {
  const { data } = await api.get('/requests/deposits/me');
  return data;
};

const getMyWithdraws = async () => {
  const { data } = await api.get('/requests/withdraws/me');
  return data;
};

const getAllDeposits = async () => {
  const { data } = await api.get('/requests/deposits');
  return data;
};

const getDepositById = async (id) => {
  const { data } = await api.get(`/requests/deposits/${id}`);
  return data;
};

const getAllWithdraws = async () => {
  const { data } = await api.get('/requests/withdraws');
  return data;
};

const approveDeposit = async (id, note) => {
  const { data } = await api.put(`/requests/deposits/${id}/approve`, { note });
  return data;
};

const rejectDeposit = async (id, note) => {
  const { data } = await api.put(`/requests/deposits/${id}/reject`, { note });
  return data;
};

const approveWithdraw = async (id, note) => {
  const { data } = await api.put(`/requests/withdraws/${id}/approve`, { note });
  return data;
};

const rejectWithdraw = async (id, note) => {
  const { data } = await api.put(`/requests/withdraws/${id}/reject`, { note });
  return data;
};

export default {
  createDeposit,
  createWithdraw,
  createBankWithdraw,
  getMyDeposits,
  getMyWithdraws,
  getAllDeposits,
  getDepositById,
  getAllWithdraws,
  approveDeposit,
  rejectDeposit,
  approveWithdraw,
  rejectWithdraw,
};
