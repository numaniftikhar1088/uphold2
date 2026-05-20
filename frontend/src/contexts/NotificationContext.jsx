import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMyNotifications, markAsRead, markAllAsRead } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, newNotification } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await getMyNotifications();
      setNotifications(data.notifications ?? data);
      setUnreadCount((data.notifications ?? data).filter((n) => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Initial load when user logs in
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time: prepend new notification pushed via socket
  useEffect(() => {
    if (!newNotification) return;
    setNotifications((prev) => {
      if (prev.some((n) => n._id === newNotification._id)) return prev;
      return [newNotification, ...prev];
    });
    if (!newNotification.read) setUnreadCount((prev) => prev + 1);
  }, [newNotification]);

  const markNotificationAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      fetchNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
