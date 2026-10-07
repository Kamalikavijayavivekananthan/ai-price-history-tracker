const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  storePrices: [
    {
      storeName: String,
      price: Number
    }
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries on product history
priceHistorySchema.index({ productId: 1, date: -1 });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
