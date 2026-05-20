import api from './api';

const submitKyc = async (kycData) => {
  const { data } = await api.post('/auth/me/kyc', kycData);
  return data;
};

const getPendingKyc = async () => {
  const { data } = await api.get('/auth/kyc/pending');
  return data;
};

const getAllKyc = async () => {
  const { data } = await api.get('/auth/kyc/all');
  return data;
};

const getKycDetail = async (userId) => {
  const { data } = await api.get(`/auth/kyc/${userId}/detail`);
  return data;
};

const verifyKyc = async (userId, note) => {
  const { data } = await api.put(`/auth/kyc/${userId}/verify`, { note });
  return data;
};

const rejectKyc = async (userId, note) => {
  const { data } = await api.put(`/auth/kyc/${userId}/reject`, { note });
  return data;
};

export default {
  submitKyc,
  getPendingKyc,
  getAllKyc,
  getKycDetail,
  verifyKyc,
  rejectKyc,
};
