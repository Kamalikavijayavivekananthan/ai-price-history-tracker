import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import {
  Sparkles, TrendingDown, TrendingUp, ShoppingCart, Clock,
  RefreshCw, Zap, Star, AlertTriangle, CheckCircle, Brain,
} from 'lucide-react';

/* ── Insight Skeleton ── */
const InsightSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 skeleton w-2/3 rounded-xl" />
    <div className="h-4 skeleton w-full rounded-lg" />
    <div className="h-4 skeleton w-4/5 rounded-lg" />
    <div className="grid grid-cols-3 gap-3 mt-4">
      {[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
    </div>
  </div>
);

const TrendBadge = ({ trend }) => {
  if (trend === 'Bullish') return (
    <span className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 text-rose-500 rounded-full text-[10px] font-bold border border-rose-500/25">
      <TrendingUp className="h-3 w-3" /> Prices Rising
    </span>
  );
  if (trend === 'Bearish') return (
    <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 text-emerald-500 rounded-full text-[10px] font-bold border border-emerald-500/25">
      <TrendingDown className="h-3 w-3" /> Prices Dropping
    </span>
  );
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/15 text-blue-500 rounded-full text-[10px] font-bold border border-blue-500/25">
      <Zap className="h-3 w-3" /> Market Stable
    </span>
  );
};

const AIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadInsights = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await api.fetchAIInsights();
      if (res.data.success) {
        setInsights(res.data.insights);
      }
    } catch (err) {
      setError('AI insights unavailable. Server may be starting up.');
      console.error('AI insights error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-xl text-white shadow-lg shadow-violet-500/25">
            <Brain className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="font-black text-lg text-slate-900 dark:text-white">
              Groq AI Market Intelligence
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold">
              Powered by Llama3 · Updated every session
            </p>
          </div>
        </div>
        <button
          onClick={() => loadInsights(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 rounded-xl border border-violet-500/20 transition-all"
          title="Refresh AI insights"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      {/* Main Card */}
      <div className="glass-panel rounded-3xl border border-violet-500/15 dark:border-violet-500/10 overflow-hidden">
        {/* Gradient top strip */}
        <div className="h-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-500" />

        <div className="p-6">
          {loading ? (
            <InsightSkeleton />
          ) : error ? (
            <div className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">AI Engine Warming Up</p>
                <p className="text-xs text-slate-500 mt-0.5">{error}</p>
              </div>
              <button
                onClick={() => loadInsights()}
                className="ml-auto px-3 py-1.5 text-xs font-bold bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-all"
              >
                Retry
              </button>
            </div>
          ) : insights ? (
            <div className="space-y-5 animate-fade-in">

              {/* Headline + Trend */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-grow">
                  <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {insights.headline}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed max-w-2xl">
                    {insights.summary}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <TrendBadge trend={insights.marketTrend} />
                </div>
              </div>

              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-violet-500/8 border border-violet-500/15 rounded-2xl px-4 py-3 text-center">
                  <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">Avg Deal Score</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{insights.avgDealScore}<span className="text-sm text-slate-400">/10</span></p>
                </div>
                <div className="bg-emerald-500/8 border border-emerald-500/15 rounded-2xl px-4 py-3 text-center">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">At Lowest Price</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{insights.atLowestPriceCount}</p>
                </div>
                <div className="bg-amber-500/8 border border-amber-500/15 rounded-2xl px-4 py-3 text-center">
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Hot Category</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5 truncate">{insights.hotCategory}</p>
                </div>
                <div className="bg-blue-500/8 border border-blue-500/15 rounded-2xl px-4 py-3 text-center">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Market</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{insights.marketTrend}</p>
                </div>
              </div>

              {/* Best Deal + AI Tip */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Best Deal Today */}
                {insights.bestDealToday && (
                  <div className="bg-gradient-to-br from-rose-500/10 to-amber-500/10 border border-rose-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-amber-500 fill-current" />
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Best Deal Today</span>
                    </div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {insights.bestDealToday.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {insights.bestDealToday.reason}
                    </p>
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="font-black text-base text-slate-900 dark:text-white">
                        ₹{insights.bestDealToday.currentPrice?.toLocaleString('en-IN')}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                        Score: {insights.bestDealToday.dealScore}/10
                      </span>
                    </div>
                  </div>
                )}

                {/* AI Tip */}
                <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">AI Smart Tip</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {insights.aiTip}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2 italic">
                    {insights.marketTrendReason}
                  </p>
                </div>
              </div>

              {/* AI Top Picks */}
              {insights.topPicks && insights.topPicks.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Brain className="h-3 w-3" />
                    AI Top Picks — Buy / Wait Recommendations
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {insights.topPicks.map((pick, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                          pick.recommendation === 'Buy Now'
                            ? 'bg-emerald-500/8 border-emerald-500/20'
                            : 'bg-amber-500/8 border-amber-500/20'
                        }`}
                      >
                        {pick.recommendation === 'Buy Now' ? (
                          <ShoppingCart className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className="text-[10px] font-black tracking-wider line-clamp-1 text-slate-900 dark:text-white">
                            {pick.title}
                          </p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                            pick.recommendation === 'Buy Now'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-amber-500 text-white'
                          }`}>
                            {pick.recommendation}
                          </span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                            {pick.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Engine badge */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {insights.engine === 'groq_llama3' ? '⚡ Groq Llama3 · Real AI Analysis' : '🔄 Fallback Analysis'}
                  </span>
                </div>
                {insights.generatedAt && (
                  <span className="text-[10px] text-slate-400">
                    {new Date(insights.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default AIInsights;
