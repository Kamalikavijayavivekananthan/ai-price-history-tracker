import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ExternalLink, Sparkles, TrendingDown, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product, isWishlisted, onWishlistToggle }) => {
  const { user } = useAuth();

  const prices = product.stores?.map(s => s.price) || [Infinity];
  const lowestCurrent = Math.min(...prices);
  const discountPercentage = product.highestPriceEver && lowestCurrent < product.highestPriceEver
    ? Math.round(((product.highestPriceEver - lowestCurrent) / product.highestPriceEver) * 100)
    : 0;

  const getScoreColor = (score) => {
    if (score >= 8) return 'bg-emerald-500 text-white';
    if (score >= 5) return 'bg-amber-500 text-white';
    return 'bg-slate-400 text-white';
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to track products!');
      return;
    }
    onWishlistToggle(product._id);
  };

  return (
    <div className="relative flex flex-col w-full rounded-2xl overflow-hidden card-3d glass-panel border border-slate-200/50 dark:border-slate-800/40 animate-fade-in-up">
      {/* Product Image & Overlay Badges */}
      <Link to={`/products/${product._id}`} className="relative h-52 w-full overflow-hidden block group">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <button
          onClick={handleWishlistClick}
          className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-300 shadow-md ${
            isWishlisted
              ? 'bg-rose-500 text-white animate-pulse-glow'
              : 'bg-white/90 text-slate-700 hover:bg-rose-500 hover:text-white dark:bg-slate-900/90 dark:text-slate-300'
          }`}
          title={isWishlisted ? 'Remove from tracking' : 'Track Price'}
        >
          <Heart className={`h-3 w-3 ${isWishlisted ? 'fill-current' : ''}`} />
          {isWishlisted ? 'Tracking' : 'Track Price'}
        </button>

        {discountPercentage > 15 && (
          <span className="absolute bottom-3 left-3 px-3 py-1 text-[10px] font-extrabold bg-rose-500 text-white shadow-md rounded-full shadow-rose-500/30">
            🔥 {discountPercentage}% OFF
          </span>
        )}

        <span
          className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold rounded-xl shadow-md flex items-center gap-1 ${getScoreColor(product.dealScore)}`}
        >
          <Sparkles className="h-3 w-3" />
          Score: {product.dealScore}
        </span>
      </Link>

      {/* Card Body */}
      <div className="flex flex-col flex-grow p-4">
        <div className="mb-3">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
            {product.brand || 'Generic'}
          </span>
          <Link to={`/products/${product._id}`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-rose-500 transition-colors mt-0.5 leading-snug">
              {product.title}
            </h3>
          </Link>
        </div>

        <div className="flex flex-col gap-1 mb-4">
          <span className="text-xs font-bold text-slate-500">Prices starting from:</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white">
            ₹{lowestCurrent.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] font-semibold text-rose-500">
            Available at {product.stores?.length || 0} stores
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 mb-5 text-[10px] font-bold mt-auto">
          <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            <span className="text-slate-400 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" /> Lowest
            </span>
            <span className="text-rose-500 text-xs font-black">
              ₹{product.lowestPriceEver?.toLocaleString('en-IN') || '--'}
            </span>
          </div>
          <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            <span className="text-slate-400 flex items-center gap-1">
              <Tag className="h-3 w-3" /> AI Prediction
            </span>
            <span className="text-slate-700 dark:text-slate-300 line-clamp-1">
              {product.aiPrediction}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 mt-auto">
          <Link
            to={`/products/${product._id}`}
            className="w-full py-2.5 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg active:scale-[0.98]"
          >
            Compare Prices
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
