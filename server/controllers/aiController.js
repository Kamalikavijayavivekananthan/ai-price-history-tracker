const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');
const {
  predictPriceWithGroq,
  analyzeDeal,
  getDashboardInsights,
  chatWithAI,
} = require('../services/groqService');

/**
 * @desc    Get full Groq AI analysis for a single product
 *          (price prediction + deal analysis combined)
 * @route   GET /api/ai/product/:id
 * @access  Public
 */
exports.getProductAIAnalysis = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Fetch recent price history (last 30 points)
    const history = await PriceHistory.find({ productId: product._id })
      .sort({ date: 1 })
      .limit(30);

    if (history.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient price history for AI analysis. Need at least 2 data points.',
      });
    }

    // Run both analyses in parallel for speed
    const [prediction, dealAnalysis] = await Promise.all([
      predictPriceWithGroq(product.title, history, product.currentPrice),
      analyzeDeal(product, history),
    ]);

    return res.json({
      success: true,
      productId: product._id,
      productTitle: product.title,
      currentPrice: product.currentPrice,
      prediction,
      dealAnalysis,
      analysisTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[AI Controller] getProductAIAnalysis:', error.message);
    return res.status(500).json({ success: false, message: 'AI analysis failed: ' + error.message });
  }
};

/**
 * @desc    Get AI-powered dashboard insights across all products
 * @route   GET /api/ai/insights
 * @access  Public
 */
exports.getDashboardAIInsights = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ dealScore: -1 }).limit(20);

    if (products.length === 0) {
      return res.json({
        success: true,
        insights: {
          headline: '🚀 Add products to start getting AI insights!',
          summary: 'No products are being tracked yet. Use the Admin Panel to add products.',
          topPicks: [],
          marketTrend: 'Stable',
          aiTip: 'Start by adding Amazon or Flipkart products in the Admin Panel.',
          engine: 'fallback',
          status: 'empty',
        },
      });
    }

    const insights = await getDashboardInsights(products);

    return res.json({
      success: true,
      insights,
      productCount: products.length,
    });
  } catch (error) {
    console.error('[AI Controller] getDashboardAIInsights:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to generate AI insights: ' + error.message });
  }
};

/**
 * @desc    AI Chatbot message handler
 * @route   POST /api/ai/chat
 * @access  Public
 */
exports.chatMessage = async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide a message' });
    }

    if (message.trim().length > 500) {
      return res.status(400).json({ success: false, message: 'Message too long. Max 500 characters.' });
    }

    // Build context from current product state
    const products = await Product.find({}).select('title currentPrice dealScore lowestPriceEver category').limit(20);
    const atLowestCount = products.filter((p) => p.currentPrice === p.lowestPriceEver).length;
    const bestDeal = products.sort((a, b) => b.dealScore - a.dealScore)[0];

    const enrichedContext = {
      totalProducts: products.length,
      atLowestCount,
      bestDealScore: bestDeal ? `${bestDeal.dealScore}/10 for ${bestDeal.title}` : 'N/A',
      hotCategory: context?.hotCategory || 'Electronics',
      ...context,
    };

    const response = await chatWithAI(message.trim(), enrichedContext);

    return res.json({
      success: true,
      reply: response.message,
      engine: response.engine,
    });
  } catch (error) {
    console.error('[AI Controller] chatMessage:', error.message);
    return res.status(500).json({
      success: false,
      reply: '🤖 AI temporarily unavailable. Please try again shortly!',
    });
  }
};
