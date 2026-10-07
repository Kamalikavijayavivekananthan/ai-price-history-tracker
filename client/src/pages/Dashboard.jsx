import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import {
  Search, SlidersHorizontal, Layers,
  TrendingDown, Sparkles, BarChart2, Zap, Cpu
} from 'lucide-react';

/* ─── Skeleton Card ─── */
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden glass-panel border border-slate-200/50 dark:border-slate-800/40">
    <div className="h-52 skeleton" />
    <div className="p-4 space-y-3">
      <div className="h-3 skeleton w-1/3" />
      <div className="h-4 skeleton w-4/5" />
      <div className="h-4 skeleton w-2/3" />
      <div className="h-6 skeleton w-1/2 mt-2" />
      <div className="flex gap-2 mt-3">
        <div className="h-9 skeleton flex-grow" />
        <div className="h-9 skeleton w-16" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('deal_score');

  // Fetch products
  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedBrand) params.brand = selectedBrand;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (sortBy) params.sortBy = sortBy;

      const res = await api.fetchProducts(params);
      if (res.data.success) {
        setProducts(res.data.products);
        setCategories(res.data.categories);
        setBrands(res.data.brands);
      }

      if (user) {
        const wishRes = await api.fetchWishlist();
        if (wishRes.data.success) {
          setWishlistIds(wishRes.data.products.map((p) => p._id));
        }
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, selectedCategory, selectedBrand, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('deal_score');
    setTimeout(loadData, 0);
  };

  const handleWishlistToggle = async (productId) => {
    const isCurrentlyWishlisted = wishlistIds.includes(productId);
    try {
      if (isCurrentlyWishlisted) {
        const res = await api.removeFromWishlist(productId);
        if (res.data.success) setWishlistIds((prev) => prev.filter((id) => id !== productId));
      } else {
        const res = await api.addToWishlist(productId);
        if (res.data.success) setWishlistIds((prev) => [...prev, productId]);
      }
    } catch (error) {
      console.error('Wishlist toggle error:', error);
    }
  };

  // Stats & Segmented Lists
  const totalMonitored = products.length;
  const trendingDeals = products.filter((p) => p.dealScore >= 8.5).slice(0, 4);
  const aiRecommended = products.filter((p) => p.aiLabel === '🤖 AI Recommended').slice(0, 4);
  const priceDropping = products.filter((p) => p.aiLabel === '📉 Price Dropping Soon').slice(0, 4);
  
  const lowestPriceProducts = products.filter((p) => Math.min(...(p.stores?.map(s => s.price) || [Infinity])) === p.lowestPriceEver).length;

  return (
    <div className="min-h-screen">
      {/* ─── HERO SECTION ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-16 px-4 mb-8">
        {/* Floating orbs */}
        <div className="hero-orb-1" />
        <div className="hero-orb-2" />
        <div className="hero-orb-3" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30">
                  <Zap className="h-3 w-3" />
                  AI-Powered Price Intelligence
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Today's Best <span className="gradient-text">AI Deals.</span>
              </h1>
              <p className="text-slate-400 mt-3 text-base max-w-xl leading-relaxed">
                Compare prices across 6 top stores in real-time. Let our AI predict the best time to buy.
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10">
            {[
              { icon: <Layers className="h-5 w-5" />, value: totalMonitored, label: 'Products Tracked', color: 'text-blue-400 bg-blue-500/15 border-blue-500/25' },
              { icon: <Sparkles className="h-5 w-5" />, value: trendingDeals.length, label: 'Hot Deals (≥8.5)', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25' },
              { icon: <TrendingDown className="h-5 w-5" />, value: lowestPriceProducts, label: 'At Lowest Price', color: 'text-rose-400 bg-rose-500/15 border-rose-500/25' },
              { icon: <Cpu className="h-5 w-5" />, value: aiRecommended.length, label: 'AI Recommended', color: 'text-amber-400 bg-amber-500/15 border-amber-500/25' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-sm animate-fade-in-up ${stat.color} stagger-${i + 1}`}
              >
                <span className="flex-shrink-0">{stat.icon}</span>
                <div>
                  <p className="text-2xl font-black text-white leading-none">{stat.value}</p>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-16">
        
        {/* ── SECTION 1: TRENDING DEALS ── */}
        {trendingDeals.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-rose-500" />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Trending Deals</h2>
              <span className="px-2.5 py-1 bg-rose-500/10 text-rose-500 text-xs font-bold rounded-full ml-2">Score ≥ 8.5</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingDeals.map((product) => (
                <ProductCard key={product._id} product={product} isWishlisted={wishlistIds.includes(product._id)} onWishlistToggle={handleWishlistToggle} />
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION 2: AI RECOMMENDED PRODUCTS ── */}
        {aiRecommended.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Cpu className="h-6 w-6 text-emerald-500" />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">AI Recommended</h2>
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full ml-2">Buy Now</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {aiRecommended.map((product) => (
                <ProductCard key={product._id} product={product} isWishlisted={wishlistIds.includes(product._id)} onWishlistToggle={handleWishlistToggle} />
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION 3: PRICE DROPPING SOON ── */}
        {priceDropping.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <TrendingDown className="h-6 w-6 text-amber-500" />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Price Dropping Soon</h2>
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full ml-2">Wait to Buy</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {priceDropping.map((product) => (
                <ProductCard key={product._id} product={product} isWishlisted={wishlistIds.includes(product._id)} onWishlistToggle={handleWishlistToggle} />
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION 4: COMPARE PRICES ACROSS STORES ── */}
        <section>
          <div className="flex items-center gap-2 mb-8">
            <BarChart2 className="h-6 w-6 text-blue-500" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Compare Prices Across Top Stores</h2>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filter */}
            <div className="w-full lg:w-64 flex-shrink-0">
              <div className="glass-panel p-6 rounded-2xl sticky top-20 space-y-6 animate-slide-in-left">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                    <SlidersHorizontal className="h-4 w-4 text-rose-500" />
                    Filters
                  </span>
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-slate-400 hover:text-rose-500 transition-colors font-semibold"
                  >
                    Clear all
                  </button>
                </div>

                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 outline-none transition-all text-slate-700 dark:text-slate-200"
                  />
                  <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors">
                    <Search className="h-3.5 w-3.5" />
                  </button>
                </form>

                {/* Category */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Category</h4>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => setSelectedCategory('')} className={`text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedCategory === '' ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>All Categories</button>
                    {categories.map((cat) => (
                      <button key={cat} onClick={() => setSelectedCategory(cat)} className={`text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedCategory === cat ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{cat}</button>
                    ))}
                  </div>
                </div>

                {/* Brand */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Brand</h4>
                  <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 outline-none text-slate-700 dark:text-slate-200">
                    <option value="">All Brands</option>
                    {brands.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Price Range (₹)</h4>
                  <div className="flex gap-2 items-center">
                    <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 outline-none text-slate-700 dark:text-slate-200" />
                    <span className="text-slate-400 text-xs">—</span>
                    <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 outline-none text-slate-700 dark:text-slate-200" />
                  </div>
                  <button onClick={loadData} className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl mt-2.5 transition-all">Apply Range</button>
                </div>

                {/* Sort By */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Sort By</h4>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 outline-none text-slate-700 dark:text-slate-200 font-semibold">
                    <option value="deal_score">🔥 Smart Deal Score</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            <div className="flex-grow">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-24 glass-panel rounded-3xl animate-fade-in">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-slate-500 text-base font-semibold">No products match your filters.</p>
                  <p className="text-slate-400 text-sm mt-1">Try adjusting or clearing the filters.</p>
                  <button onClick={handleClearFilters} className="mt-6 px-6 py-2.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20">
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product, i) => (
                    <div key={product._id} className={`stagger-${Math.min(i + 1, 6)} animate-fade-in-up`}>
                      <ProductCard product={product} isWishlisted={wishlistIds.includes(product._id)} onWishlistToggle={handleWishlistToggle} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;
