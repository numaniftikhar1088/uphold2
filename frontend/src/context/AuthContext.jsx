import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import authService, { setAuthToken } from '../services/authService';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('uphold_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('uphold_token'));
  const [tradeUpdate, setTradeUpdate] = useState(null);
  const [newNotification, setNewNotification] = useState(null);
  const socketRef = useRef(null);
  // Tracks whether the token was just set by a login/register action so we
  // can skip the redundant getProfile call (the action already returns fresh data).
  const skipNextSyncRef = useRef(false);

  // Persist auth state
  useEffect(() => {
    if (token) {
      localStorage.setItem('uphold_token', token);
      setAuthToken(token);
    } else {
      localStorage.removeItem('uphold_token');
      setAuthToken(null);
    }
    if (user) {
      localStorage.setItem('uphold_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('uphold_user');
    }
  }, [user, token]);

  // Sync user data from server on page load / refresh.
  // Skipped when token was just set by login/register (response already has fresh data).
  useEffect(() => {
    if (!token) return;
    if (skipNextSyncRef.current) { skipNextSyncRef.current = false; return; }
    authService.getProfile(token)
      .then(({ user: fresh }) => {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, balance: fresh.balance, referralCode: fresh.referralCode ?? prev.referralCode, kycStatus: fresh.kycStatus ?? prev.kycStatus };
          localStorage.setItem('uphold_user', JSON.stringify(updated));
          return updated;
        });
      })
      .catch(() => {});
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Single socket connection for the logged-in user — listens for balance updates
  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token, role: user.role, name: user.name },
    });
    socketRef.current = socket;

    socket.on('balance_update', ({ balance, trade }) => {
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, balance };
        localStorage.setItem('uphold_user', JSON.stringify(updated));
        return updated;
      });
      if (trade) setTradeUpdate(trade);
    });

    socket.on('new_notification', (notification) => {
      setNewNotification(notification);
    });

    socket.on('connect_error', (err) => {
      console.warn('Balance socket error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    skipNextSyncRef.current = true; // login response already has fresh user data
    setUser(response.user);
    setToken(response.token);
    return response;
  };

  const register = async (payload) => {
    const response = await authService.register(payload);
    skipNextSyncRef.current = true; // register response already has fresh user data
    setUser(response.user);
    setToken(response.token);
    return response;
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('uphold_user');
    localStorage.removeItem('uphold_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, tradeUpdate, newNotification }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
