const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a product title'],
    trim: true,
  },
  description: {
    type: String,
  },
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
  },
  brand: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    trim: true,
    required: [true, 'Please add a product category'],
  },
  stores: [
    {
      storeName: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      link: {
        type: String,
        required: true,
      }
    }
  ],
  lowestPriceEver: {
    type: Number,
  },
  highestPriceEver: {
    type: Number,
  },
  aiPrediction: {
    type: String,
    default: 'Evaluating...',
  },
  offer: {
    type: String,
    default: '',
  },
  dealScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 0,
  },
  aiLabel: {
    type: String,
    default: '', // e.g. "🔥 Best Deal" or "📉 Price Dropping Soon"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to compute lowest price and deal score
productSchema.pre('save', function (next) {
  if (!this.stores || this.stores.length === 0) return next();

  const prices = this.stores.map(s => s.price);
  const currentLowest = Math.min(...prices);
  const currentHighest = Math.max(...prices);
  
  if (!this.lowestPriceEver || currentLowest < this.lowestPriceEver) {
    this.lowestPriceEver = currentLowest;
  }
  if (!this.highestPriceEver || currentHighest > this.highestPriceEver) {
    this.highestPriceEver = currentHighest;
  }

  // Calculate Deal Score (0 - 10)
  let proximityScore = 10;
  if (this.highestPriceEver > this.lowestPriceEver) {
    const priceRange = this.highestPriceEver - this.lowestPriceEver;
    const distanceFromLow = currentLowest - this.lowestPriceEver;
    proximityScore = ((priceRange - distanceFromLow) / priceRange) * 10;
  }

  this.dealScore = parseFloat(Math.min(Math.max(proximityScore, 0), 10).toFixed(1));
  
  // Auto-assign AI Label
  if (this.dealScore >= 9.0 && currentLowest === this.lowestPriceEver) {
    this.aiLabel = '🔥 Best Deal';
    this.aiPrediction = 'Buy immediately! Record low price.';
  } else if (this.dealScore >= 7.5) {
    this.aiLabel = '🤖 AI Recommended';
    this.aiPrediction = 'Good time to buy. Price is competitive.';
  } else if (this.dealScore < 4.0) {
    this.aiLabel = '📉 Price Dropping Soon';
    this.aiPrediction = 'Wait 5-7 days. Price is highly inflated.';
  } else {
    this.aiLabel = '';
    this.aiPrediction = 'Wait for a better offer.';
  }

  next();
});

module.exports = mongoose.model('Product', productSchema);
