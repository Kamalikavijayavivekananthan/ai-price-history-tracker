const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  targetPrice: {
    type: Number,
    required: true,
  },
  isTriggered: {
    type: Boolean,
    default: false,
  },
  channel: {
    type: String,
    enum: ['email', 'push'],
    default: 'email',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Alert', alertSchema);
