import React, { createContext, useState, useEffect, useContext } from 'react';
import * as api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load user profile on startup if token exists
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.getProfile();
          if (res.data.success) {
            setUser(res.data.user);
            await fetchUserNotifications();
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Session validation failed:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Poll for notifications every 10 seconds if user is logged in
  useEffect(() => {
    if (!user) return;
    
    fetchUserNotifications();
    const interval = setInterval(fetchUserNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchUserNotifications = async () => {
    try {
      const res = await api.fetchNotifications();
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.notifications.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        await fetchUserNotifications();
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Invalid credentials' };
    } catch (error) {
      console.error('Login error:', error);
      const data = error.response?.data;
      return {
        success: false,
        message: data?.message || 'Invalid credentials',
        needsVerification: data?.needsVerification || false,
        email: data?.email || email,
      };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await api.register({ name, email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        setNotifications([]);
        setUnreadCount(0);
        return { success: true };
      }
      // ✅ Fallback: API responded but success was false
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
  };

  const markRead = async (id) => {
    try {
      const res = await api.markNotificationRead(id);
      if (res.data.success) {
        setNotifications(prev =>
          prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await api.markAllNotificationsRead();
      if (res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteNotif = async (id) => {
    try {
      const res = await api.deleteNotification(id);
      if (res.data.success) {
        const wasUnread = notifications.find(n => n._id === id && !n.isRead);
        setNotifications(prev => prev.filter(n => n._id !== id));
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        notifications,
        unreadCount,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        fetchNotifications: fetchUserNotifications,
        markRead,
        markAllRead,
        deleteNotif,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
