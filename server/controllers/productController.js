const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');
const { fetchProductDetails, generateHistoricalData } = require('../services/scraper');
const { predictPrice } = require('../services/aiService');

// @desc    Get all products (with search, filter, sorting)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { search, category, brand, minPrice, maxPrice, sortBy, dealScore } = req.query;

    // Build query object
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      // Find products where either amazonPrice or flipkartPrice is within range
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);

      query["stores.price"] = priceFilter;
    }

    if (dealScore) {
      query.dealScore = { $gte: Number(dealScore) };
    }

    // Determine Sorting
    let sortOption = { createdAt: -1 }; // default: newest

    if (sortBy) {
      if (sortBy === 'price_asc') {
        sortOption = { lowestPriceEver: 1 };
      } else if (sortBy === 'price_desc') {
        sortOption = { lowestPriceEver: -1 };
      } else if (sortBy === 'deal_score') {
        sortOption = { dealScore: -1 };
      } else if (sortBy === 'biggest_discount') {
        // We can approximate this sorting via dealScore since dealScore strongly weights discount percentage
        sortOption = { dealScore: -1 };
      }
    }

    const products = await Product.find(query).sort(sortOption);
    
    // Get unique categories and brands for filtering on frontend
    const categories = await Product.distinct('category');
    const brands = await Product.distinct('brand');

    return res.json({
      success: true,
      count: products.length,
      categories,
      brands,
      products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error fetching products' });
  }
};

// @desc    Get single product details with its price history
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get 40 most recent price history points
    const history = await PriceHistory.find({ productId: product._id })
      .sort({ date: 1 }); // oldest to newest for charts

    return res.json({
      success: true,
      product,
      priceHistory: history,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add a product manually or via scraped link
// @route   POST /api/products
// @access  Private/Admin (Let's make it authenticated, but keep it accessible for easy client operations)
exports.addProduct = async (req, res) => {
  try {
    const { url, title, currentPrice, category } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: 'Please provide a product e-commerce URL' });
    }

    // Check if product already exists
    let existingProduct = await Product.findOne({ url });
    if (existingProduct) {
      return res.status(400).json({ success: false, message: 'Product already being tracked', product: existingProduct });
    }

    // Fetch details (scraped or simulated)
    const productData = await fetchProductDetails(url, title, 50000, category);
    
    // Create product
    const product = new Product(productData);
    await product.save(); // triggers pre-save dealScore computation

    // Generate historical price data (30 days of data)
    await generateHistoricalData(product._id, product.stores);

    return res.status(201).json({
      success: true,
      message: 'Product added successfully and history initialized.',
      product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error adding product' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Remove product and associated price history
    await Product.findByIdAndDelete(req.params.id);
    await PriceHistory.deleteMany({ productId: req.params.id });

    return res.json({
      success: true,
      message: 'Product and historical records deleted successfully',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error deleting product' });
  }
};

// @desc    Get AI Price Prediction for a product
// @route   GET /api/products/:id/predict
// @access  Public
exports.getProductPrediction = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get historical price points (sorted oldest to newest)
    const history = await PriceHistory.find({ productId: product._id }).sort({ date: 1 });
    
    if (history.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient historical data to make AI predictions. Ensure at least two records exist.',
      });
    }

    // Format for python/JS ML script input
    const formattedHistory = history.map((item) => ({
      price: Math.min(...item.storePrices.map(s => s.price)),
      date: item.date.toISOString(),
    }));

    // Run prediction
    const prediction = await predictPrice(formattedHistory);

    return res.json({
      success: true,
      productId: product._id,
      prediction,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error calculating predictions' });
  }
};


