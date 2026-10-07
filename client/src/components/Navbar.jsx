import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bell, Sun, Moon, LogOut, ShieldAlert, Sparkles,
  Trash2, CheckCircle2, Menu, X, Heart,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, notifications, unreadCount, markRead, markAllRead, deleteNotif } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [showNotif, setShowNotif] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifRef = useRef(null);

  // Sync dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const handleNotifClick = async (n) => {
    if (!n.isRead) await markRead(n._id);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/85 backdrop-blur-lg border-b border-slate-200/60 dark:bg-slate-950/85 dark:border-slate-800/50 transition-colors duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 font-black text-xl tracking-tight text-slate-900 dark:text-white group">
            <span className="p-1.5 bg-gradient-to-tr from-rose-500 to-amber-500 rounded-xl text-white shadow-md group-hover:shadow-rose-500/30 transition-shadow">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <span>
              Smart<span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">Cart</span>{' '}
              <span className="text-slate-400 dark:text-slate-500 font-semibold text-sm">AI</span>
            </span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-rose-500 dark:text-slate-300 dark:hover:text-rose-400 rounded-lg hover:bg-rose-500/5 transition-all"
            >
              Dashboard
            </Link>
            {user && (
              <Link
                to="/wishlist"
                className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-rose-500 dark:text-slate-300 dark:hover:text-rose-400 rounded-lg hover:bg-rose-500/5 transition-all flex items-center gap-1.5"
              >
                <Heart className="h-3.5 w-3.5" />
                Wishlist
              </Link>
            )}
          </div>

          {/* ── Right Side Controls ── */}
          <div className="flex items-center gap-2">

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDark((d) => !d)}
              id="dark-mode-toggle"
              className="p-2.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/8 dark:text-slate-400 dark:hover:text-rose-400 rounded-xl transition-all"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Notification Bell */}
            {user && (
              <div className="relative bell-ring" ref={notifRef}>
                <button
                  onClick={() => setShowNotif((s) => !s)}
                  id="notification-bell"
                  className="relative p-2.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/8 dark:text-slate-400 dark:hover:text-rose-400 rounded-xl transition-all"
                  title="Notifications"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 flex items-center justify-center bg-rose-500 text-white text-[9px] font-black rounded-full animate-pulse-glow leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotif && (
                  <div className="absolute right-0 top-full mt-2 w-80 glass-panel rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden animate-scale-in">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Bell className="h-4 w-4 text-rose-500" />
                        Notifications
                        {unreadCount > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full leading-none">
                            {unreadCount}
                          </span>
                        )}
                      </span>
                      {notifications.length > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[10px] text-slate-400 hover:text-rose-500 font-semibold transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <p className="text-2xl mb-2">🔔</p>
                          <p className="text-xs text-slate-400">No notifications yet.</p>
                          <p className="text-[10px] text-slate-400 mt-1">Set price alerts to get notified!</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            onClick={() => handleNotifClick(n)}
                            className={`flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 last:border-0 cursor-pointer transition-colors ${
                              n.isRead
                                ? 'opacity-60 hover:opacity-80'
                                : 'bg-rose-500/4 hover:bg-rose-500/8'
                            }`}
                          >
                            <span className={`mt-0.5 flex-shrink-0 ${n.isRead ? 'text-slate-400' : 'text-rose-500'}`}>
                              {n.isRead ? <CheckCircle2 className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                            </span>
                            <div className="flex-grow min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{n.title}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNotif(n._id); }}
                              className="flex-shrink-0 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth Actions */}
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-[100px] truncate">
                  Hi, {user.name?.split(' ')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  id="logout-btn"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-500/8 rounded-xl transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  id="login-link"
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 rounded-xl hover:bg-rose-500/8 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  id="register-link"
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-amber-500 rounded-xl hover:opacity-90 transition-all shadow-md shadow-rose-500/20"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="md:hidden p-2.5 text-slate-500 hover:text-rose-500 rounded-xl transition-all"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-slate-100 dark:border-slate-800 mt-2 pt-4 space-y-1 animate-fade-in">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-500/8 hover:text-rose-500 rounded-xl transition-all">
              Dashboard
            </Link>
            {user && (
              <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-500/8 hover:text-rose-500 rounded-xl transition-all">
                Wishlist & Alerts
              </Link>
            )}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
              {user ? (
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-500/8 rounded-xl transition-all flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout ({user.name?.split(' ')[0]})
                </button>
              ) : (
                <div className="flex gap-2 px-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                    Sign In
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2.5 text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-amber-500 rounded-xl transition-all">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
