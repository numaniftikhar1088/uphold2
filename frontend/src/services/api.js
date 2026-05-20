import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

// Auto-logout when the server returns 401 (expired or invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('uphold_token');
      localStorage.removeItem('uphold_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Set token synchronously at module init to prevent 401s on first render after reload
const _storedToken = localStorage.getItem('uphold_token');
if (_storedToken) api.defaults.headers.common.Authorization = `Bearer ${_storedToken}`;

export default api;
