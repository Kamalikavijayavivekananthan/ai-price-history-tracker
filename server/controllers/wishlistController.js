const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res) => {
  try {
    const wishlistItems = await Wishlist.find({ userId: req.user.id })
      .populate('productId')
      .sort({ createdAt: -1 });

    // Filter out items where the product might have been deleted from DB
    const products = wishlistItems
      .filter(item => item.productId !== null)
      .map(item => item.productId);

    return res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error retrieving wishlist' });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Please provide a product ID' });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if already in wishlist
    const exists = await Wishlist.findOne({ userId: req.user.id, productId });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Product already in wishlist' });
    }

    const wishlistItem = new Wishlist({
      userId: req.user.id,
      productId,
    });

    await wishlistItem.save();

    return res.status(201).json({
      success: true,
      message: 'Product added to wishlist',
      wishlistItem,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error saving to wishlist' });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
exports.removeFromWishlist = async (req, res) => {
  try {
    const deleted = await Wishlist.findOneAndDelete({
      userId: req.user.id,
      productId: req.params.productId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Item not found in wishlist' });
    }

    return res.json({
      success: true,
      message: 'Product removed from wishlist',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error removing from wishlist' });
  }
};
