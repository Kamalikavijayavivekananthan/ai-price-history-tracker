import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PriceChart from '../components/PriceChart';
import {
  ExternalLink,
  Sparkles,
  Bell,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  Play,
  Heart,
  ChevronLeft,
} from 'lucide-react';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [wishlisted, setWishlisted] = useState(false);
  
  // Alert setup states
  const [targetPrice, setTargetPrice] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [alertSuccess, setAlertSuccess] = useState('');
  const [alertError, setAlertError] = useState('');

  // Simulator states
  const [newSimulatedPrice, setNewSimulatedPrice] = useState('');
  const [simMessage, setSimMessage] = useState('');

  // Loading indicator states
  const [loading, setLoading] = useState(true);
  const [predictionLoading, setPredictionLoading] = useState(false);

  const loadProductData = async () => {
    try {
      const res = await api.fetchProductById(id);
      if (res.data.success) {
        setProduct(res.data.product);
        setHistory(res.data.priceHistory);
      }

      // Check if wishlisted
      if (user) {
        const wishRes = await api.fetchWishlist();
        if (wishRes.data.success) {
          const isWish = wishRes.data.products.some(p => p._id === id);
          setWishlisted(isWish);
        }

        // Load active alerts for this product
        const alertsRes = await api.fetchAlerts();
        if (alertsRes.data.success) {
          const matchingAlerts = alertsRes.data.alerts.filter(
            (a) => a.productId?._id === id && !a.isTriggered
          );
          setAlerts(matchingAlerts);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductData();
  }, [id, user]);

  // Request AI price prediction
  const getAIRecommendation = async () => {
    if (prediction) return; // already loaded
    setPredictionLoading(true);
    try {
      const res = await api.fetchPricePrediction(id);
      if (res.data.success) {
        setPrediction(res.data.prediction);
      }
    } catch (error) {
      console.error('Failed to get predictions:', error);
    } finally {
      setPredictionLoading(false);
    }
  };

  // Add alert
  const handleCreateAlert = async (e) => {
    e.preventDefault();
    setAlertSuccess('');
    setAlertError('');

    if (!user) {
      alert('Please sign in to set alerts!');
      return;
    }

    if (!targetPrice || Number(targetPrice) <= 0) {
      setAlertError('Please enter a valid target price.');
      return;
    }

    try {
      const res = await api.createAlert(id, targetPrice);
      if (res.data.success) {
        setAlertSuccess('🔔 Target alert saved successfully!');
        setTargetPrice('');
        // Reload alerts list
        const alertsRes = await api.fetchAlerts();
        if (alertsRes.data.success) {
          const matchingAlerts = alertsRes.data.alerts.filter(
            (a) => a.productId?._id === id && !a.isTriggered
          );
          setAlerts(matchingAlerts);
        }
      }
    } catch (error) {
      setAlertError(error.response?.data?.message || 'Error creating alert.');
    }
  };

  // Delete alert
  const handleDeleteAlert = async (alertId) => {
    try {
      const res = await api.deleteAlert(alertId);
      if (res.data.success) {
        setAlerts(prev => prev.filter(a => a._id !== alertId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Wishlist toggle
  const handleWishlistToggle = async () => {
    if (!user) {
      alert('Please sign in to save products.');
      return;
    }
    try {
      if (wishlisted) {
        const res = await api.removeFromWishlist(id);
        if (res.data.success) setWishlisted(false);
      } else {
        const res = await api.addToWishlist(id);
        if (res.data.success) setWishlisted(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Price simulator helper
  const handlePriceSimulation = async (e) => {
    e.preventDefault();
    setSimMessage('');
    try {
      const res = await api.simulatePriceUpdate(id, newSimulatedPrice);
      if (res.data.success) {
        setSimMessage('Price updated in DB! Refreshing chart...');
        await loadProductData();
        // Clear prediction cache as data changed
        setPrediction(null);
        setTimeout(() => setSimMessage(''), 3000);
      }
    } catch (error) {
      console.error(error);
      setSimMessage('Simulation error.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Product not found.</h2>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const prices = product.stores?.map(s => s.price) || [Infinity];
  const currentLowest = Math.min(...prices);

  const discount = product.highestPriceEver > 0 
    ? Math.round(((product.highestPriceEver - currentLowest) / product.highestPriceEver) * 100)
    : 0;

  // Proximity meter progress
  const priceRange = product.highestPriceEver - product.lowestPriceEver;
  const proximityPercent = priceRange > 0
    ? ((currentLowest - product.lowestPriceEver) / priceRange) * 100
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 font-semibold transition-colors"
      >
        <ChevronLeft className="h-4.5 w-4.5" />
        Back to Dashboard
      </button>

      {/* Main product info details layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Left Side: Product Card Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 relative overflow-hidden">
            <div className="h-64 rounded-2xl overflow-hidden mb-4">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {product.brand}
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 leading-snug">
                {product.title}
              </h2>
              <span className="inline-block px-2.5 py-0.5 text-xs font-bold bg-slate-100 text-slate-800 rounded-full dark:bg-slate-800 dark:text-slate-200 mt-2">
                {product.category}
              </span>
            </div>

            <hr className="border-slate-100 dark:border-slate-800 my-4" />

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-950 dark:text-white">
                ₹{currentLowest.toLocaleString('en-IN')}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-sm text-slate-400 line-through">
                    ₹{product.highestPriceEver.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-bold text-emerald-500">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Wishlist toggle */}
            <button
              onClick={handleWishlistToggle}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 mt-5 border transition-all ${
                wishlisted
                  ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-800/50'
              }`}
            >
              <Heart className={`h-4 w-4 ${wishlisted ? 'fill-current' : ''}`} />
              {wishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
            </button>

            {/* Stores List */}
            <div className="mt-6 space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Available Stores</h3>
              {product.stores?.sort((a,b) => a.price - b.price).map((store, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{store.storeName}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm text-slate-900 dark:text-white">₹{store.price.toLocaleString('en-IN')}</span>
                    <button
                      onClick={() => window.open(store.link, '_blank')}
                      className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all"
                      title={`Visit ${store.storeName}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deal Analytics & Thresholds details */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              Historical Highlights
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Lowest Price
                </span>
                <span className="text-base font-extrabold text-emerald-500 mt-1 block">
                  ₹{product.lowestPriceEver?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Highest Price
                </span>
                <span className="text-base font-extrabold text-rose-500 mt-1 block">
                  ₹{product.highestPriceEver?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Proximity Range Meter */}
            <div className="mt-5">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
                <span>Lowest</span>
                <span>Current Price Range</span>
                <span>Highest</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-500"
                  style={{ width: `${proximityPercent}%` }}
                ></div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-4 w-4 bg-white dark:bg-slate-950 border-2 border-slate-900 dark:border-slate-100 rounded-full shadow-md"
                  style={{ left: `calc(${proximityPercent}% - 8px)` }}
                ></div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">Smart Deal Score:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold">
                {product.dealScore} / 10
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Charts, Alerts, Predictions, and Simulator */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Price Chart area */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Price History & Predictions
              </h3>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-blue-500 rounded-full"></span>
                  Actual
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-rose-500 rounded-full border border-dashed border-rose-500"></span>
                  AI Forecast
                </span>
              </div>
            </div>
            
            <PriceChart
              historyData={history}
              predictionData={prediction ? prediction.predictions : []}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* AI Recommendation Widget */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 flex flex-col justify-between min-h-[250px]">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-4.5 w-4.5 text-rose-500" />
                  AI Prediction Model
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Using linear regression trends over tracking timelines to estimate next 7-day shifts.
                </p>

                {prediction ? (
                  <div className="space-y-4">
                    {/* Recommendation Card */}
                    <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
                      prediction.recommendation === 'Wait'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      <span className="mt-0.5">
                        {prediction.recommendation === 'Wait' ? (
                          <TrendingDown className="h-5 w-5" />
                        ) : (
                          <TrendingUp className="h-5 w-5" />
                        )}
                      </span>
                      <div>
                        <p className="font-bold text-sm">
                          AI Recommendation: {prediction.recommendation}
                        </p>
                        <p className="text-xs mt-1 leading-relaxed opacity-90">
                          {prediction.advice}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold px-1">
                      <span className="text-slate-400">Prediction Confidence:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{prediction.confidence}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-xs text-slate-400 mb-3">Predictions not loaded yet.</p>
                    <button
                      onClick={getAIRecommendation}
                      disabled={predictionLoading}
                      className="px-4 py-2 bg-rose-500 text-white font-bold text-xs rounded-xl hover:bg-rose-600 transition-all flex items-center gap-1.5 shadow-md shadow-rose-500/10"
                    >
                      {predictionLoading ? (
                        'Generating Forecast...'
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Generate AI Forecast
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Price Alert System */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 flex flex-col justify-between min-h-[250px]">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                  <Bell className="h-4.5 w-4.5 text-blue-500" />
                  Target Price Drop Alert
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Set a price target. We'll monitor it and shoot an email alert once the price meets your target!
                </p>

                {alertSuccess && (
                  <p className="text-xs text-emerald-500 font-bold mb-3">{alertSuccess}</p>
                )}
                {alertError && (
                  <p className="text-xs text-rose-500 font-bold mb-3">{alertError}</p>
                )}

                <form onSubmit={handleCreateAlert} className="flex gap-2">
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder={`e.g. ${Math.round(currentLowest * 0.95)}`}
                    className="flex-grow px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-slate-700 dark:text-slate-200"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all shadow-md"
                  >
                    Set Alert
                  </button>
                </form>

                {/* Active Alerts List */}
                <div className="mt-4 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active Target Alerts
                  </span>
                  {alerts.length === 0 ? (
                    <span className="text-[10px] text-slate-400 block italic">No alerts set for this item.</span>
                  ) : (
                    alerts.map((al) => (
                      <div key={al._id} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-950/60 p-2 rounded-lg">
                        <span className="text-slate-600 dark:text-slate-300">
                          Alert when price is ≤ <strong>₹{al.targetPrice.toLocaleString('en-IN')}</strong>
                        </span>
                        <button
                          onClick={() => handleDeleteAlert(al._id)}
                          className="text-rose-500 hover:underline text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>



        </div>

      </div>
    </div>
  );
};

export default ProductDetails;
