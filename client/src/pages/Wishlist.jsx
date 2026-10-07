import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Heart, Bell, Trash2, ShieldAlert, AlertCircle, ArrowUpRight } from 'lucide-react';

const Wishlist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWishlistData = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch Wishlist items
      const wishRes = await api.fetchWishlist();
      if (wishRes.data.success) {
        setWishlist(wishRes.data.products);
      }

      // 2. Fetch Alert items
      const alertRes = await api.fetchAlerts();
      if (alertRes.data.success) {
        setAlerts(alertRes.data.alerts);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlistData();
  }, [user]);

  const handleRemoveWishlist = async (productId) => {
    try {
      const res = await api.removeFromWishlist(productId);
      if (res.data.success) {
        setWishlist(prev => prev.filter((p) => p._id !== productId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancelAlert = async (alertId) => {
    try {
      const res = await api.deleteAlert(alertId);
      if (res.data.success) {
        setAlerts(prev => prev.filter((a) => a._id !== alertId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => !a.isTriggered && a.productId !== null);
  const triggeredAlerts = alerts.filter(a => a.isTriggered && a.productId !== null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">
        Your Wishlist & Active Alerts
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Wishlist Products Catalog (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <Heart className="h-5 w-5 text-rose-500 fill-current" />
              Saved Products ({wishlist.length})
            </h2>

            {wishlist.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 text-sm">Your wishlist is empty.</p>
                <Link
                  to="/"
                  className="mt-4 inline-block px-5 py-2.5 bg-rose-500 text-white font-bold text-xs rounded-xl hover:bg-rose-600 transition-colors shadow-md"
                >
                  Explore Products
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {wishlist.map((item) => (
                  <div key={item._id} className="py-4 flex gap-4 first:pt-0 last:pb-0 items-center justify-between group">
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <Link to={`/products/${item._id}`} className="font-bold text-slate-900 dark:text-white hover:text-rose-500 text-sm sm:text-base line-clamp-1 transition-colors">
                          {item.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                            Starting from ₹{Math.min(...(item.stores?.map(s => s.price) || [0])).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-slate-400 capitalize bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        to={`/products/${item._id}`}
                        className="p-2 text-slate-400 hover:text-rose-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all"
                        title="View at Store"
                      >
                        <ArrowUpRight className="h-4.5 w-4.5" />
                      </Link>
                      <button
                        onClick={() => handleRemoveWishlist(item._id)}
                        className="p-2 text-slate-400 hover:text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl border border-rose-500/10 transition-all"
                        title="Remove wishlist"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Price Alerts Management (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Alerts Panel */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-blue-500" />
              Active Price Alerts
            </h2>

            {activeAlerts.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No active price alerts set.</p>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((al) => (
                  <div key={al._id} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-900 flex flex-col justify-between">
                    <div>
                      <Link to={`/products/${al.productId._id}`} className="text-xs font-bold text-slate-900 dark:text-white hover:text-rose-500 line-clamp-1">
                        {al.productId.title}
                      </Link>
                      
                      <div className="flex justify-between items-center mt-2.5 text-[10px] font-bold text-slate-400">
                        <span>Current: ₹{Math.min(...(al.productId.stores?.map(s => s.price) || [0])).toLocaleString('en-IN')}</span>
                        <span className="text-rose-500">Target: ₹{al.targetPrice.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCancelAlert(al._id)}
                      className="w-full py-1.5 mt-3 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-bold transition-all"
                    >
                      Cancel Alert Rule
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Triggered Alerts History */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <AlertCircle className="h-4.5 w-4.5 text-emerald-500" />
              Triggered Alert Logs
            </h2>

            {triggeredAlerts.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic py-2">No alerts have triggered yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {triggeredAlerts.map((al) => (
                  <div key={al._id} className="p-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-[10px] leading-relaxed">
                    <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{al.productId?.title}</span>
                    <span className="text-slate-400">Triggered at target price of <strong>₹{al.targetPrice.toLocaleString('en-IN')}</strong></span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Wishlist;
