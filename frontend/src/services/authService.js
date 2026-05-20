import api, { setAuthToken } from './api';

const register = async (payload) => {
  const { data } = await api.post('/auth/register', payload);
  setAuthToken(data.token);
  return data;
};

const login = async (payload) => {
  try {
    const { data } = await api.post('/auth/login', payload, { timeout: 45000 });
    setAuthToken(data.token);
    return data;
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      throw new Error('Login timed out. Please try again.');
    }
    if (!err.response) {
      throw new Error('Unable to reach the server. Check your backend or network connection.');
    }
    throw err;
  }
};

const getProfile = async (token) => {
  setAuthToken(token);
  const { data } = await api.get('/auth/me', { timeout: 45000 });
  return data;
};

const checkReferralCode = async (code) => {
  const { data } = await api.get(`/auth/check-referral?code=${encodeURIComponent(code)}`);
  return data; // { valid: true | false }
};

export { setAuthToken };

export default {
  register,
  login,
  getProfile,
  checkReferralCode,
};
