import api from './api';

const getMyBankAccounts = async () => {
  const { data } = await api.get('/banks');
  return data;
};

const addBankAccount = async (payload) => {
  const { data } = await api.post('/banks', payload);
  return data;
};

const deleteBankAccount = async (id) => {
  const { data } = await api.delete(`/banks/${id}`);
  return data;
};

const getAllBankAccountsAdmin = async () => {
  const { data } = await api.get('/banks/admin/all');
  return data;
};

export default { getMyBankAccounts, addBankAccount, deleteBankAccount, getAllBankAccountsAdmin };
