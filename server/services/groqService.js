const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Supported active Groq models in fallback priority
const CANDIDATE_MODELS = [
  process.env.GROQ_MODEL,
  'qwen/qwen3.8-27b',
  'groq/compound-mini',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
].filter(Boolean);

/**
 * Execute chat completion with automatic model fallback
 */
const createChatCompletion = async (params) => {
  let lastError;
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await groq.chat.completions.create({
        ...params,
        model,
      });
      return { response, modelUsed: model };
    } catch (err) {
      lastError = err;
      console.warn(`[GROQ] Attempt with model ${model} failed: ${err.message}. Trying next candidate...`);
    }
  }
  throw lastError;
};

/**
 * Safely parse JSON from Groq response.
 * Groq might wrap JSON in markdown code blocks - this handles that.
 */
const parseGroqJSON = (text) => {
  try {
    // Remove markdown code fences if present
    const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
};

/**
 * FEATURE 1 — AI Price Prediction
 * Analyzes price history and returns a 7-day prediction with natural language reasoning.
 */
const predictPriceWithGroq = async (productTitle, priceHistory, currentPrice) => {
  try {
    const prices = priceHistory.map((h) => h.price);
    const dates = priceHistory.map((h) => new Date(h.date).toLocaleDateString('en-IN'));

    const prompt = `You are an expert e-commerce price analyst AI for an Indian market price tracker app called SmartDeal AI.

Analyze this product's price history and give a smart prediction.

Product: ${productTitle}
Current Price: ₹${currentPrice}
Historical Price Data (last ${prices.length} data points, oldest to newest):
${prices.map((p, i) => `Day ${i + 1} (${dates[i]}): ₹${p}`).join('\n')}

Provide your analysis as a JSON object with EXACTLY this structure:
{
  "recommendation": "Buy Now" or "Wait",
  "confidence": <number 60-98>,
  "predictedPrice7Days": <number>,
  "expectedChange": <number, can be negative>,
  "trend": "Upward" or "Downward" or "Stable",
  "advice": "<2 sentence natural language advice mentioning ₹ amounts>",
  "reasoning": "<1-2 sentences explaining your analysis>",
  "bestTimeToBy": "<string like 'Within 3 days' or 'After 7 days' or 'Buy immediately'>",
  "predictions": [
    {"day": 1, "price": <number>},
    {"day": 2, "price": <number>},
    {"day": 3, "price": <number>},
    {"day": 4, "price": <number>},
    {"day": 5, "price": <number>},
    {"day": 6, "price": <number>},
    {"day": 7, "price": <number>}
  ]
}

Return ONLY the JSON object, no markdown, no extra text.`;

    const { response, modelUsed } = await createChatCompletion({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content || '';
    const parsed = parseGroqJSON(content);

    if (parsed && parsed.recommendation) {
      return { ...parsed, engine: `groq_${modelUsed}`, status: 'success' };
    }

    // Fallback if parsing fails
    return buildFallbackPrediction(prices, currentPrice);
  } catch (error) {
    console.error('[GROQ] predictPriceWithGroq error:', error.message);
    return buildFallbackPrediction(priceHistory.map((h) => h.price), currentPrice);
  }
};

/**
 * FEATURE 2 — Deal Authenticity Analysis
 * Detects real vs fake discounts and provides deal quality scoring.
 */
const analyzeDeal = async (product, priceHistory) => {
  try {
    const prices = priceHistory.map((h) => h.price);
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : product.currentPrice;
    const discountFromOriginal = product.originalPrice > 0
      ? Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100)
      : 0;
    const discountFromAvg = avgPrice > 0
      ? Math.round(((avgPrice - product.currentPrice) / avgPrice) * 100)
      : 0;

    const prompt = `You are a smart deal verification AI for SmartDeal AI, an Indian e-commerce price tracker.

Analyze this product deal and determine if it's genuine or inflated.

Product: ${product.title}
Category: ${product.category}
Brand: ${product.brand || 'Unknown'}
Listed Original Price: ₹${product.originalPrice}
Current Price: ₹${product.currentPrice}
Historical Average Price: ₹${avgPrice}
Historical Lowest Price: ₹${product.lowestPriceEver || product.currentPrice}
Historical Highest Price: ₹${product.highestPriceEver || product.originalPrice}
Discount claimed by seller: ${discountFromOriginal}%
Actual discount vs average: ${discountFromAvg}%
Number of price data points: ${prices.length}

Respond with ONLY a JSON object in this exact structure:
{
  "dealVerdict": "Genuine Deal" or "Inflated Discount" or "Average Deal" or "Best Price",
  "dealScore": <number 1.0-10.0 with one decimal>,
  "isGenuine": <true or false>,
  "actualDiscount": ${discountFromAvg},
  "claimedDiscount": ${discountFromOriginal},
  "inflationFactor": "<e.g. 'Original price is artificially high by ~30%' or 'Price is legitimate'>",
  "verdict": "<1 sentence verdict on this deal>",
  "buyReason": "<1 sentence reason to buy or not>",
  "riskLevel": "Low" or "Medium" or "High",
  "aiDealScore": "<score like 8.5/10 with brief justification>"
}

Return ONLY the JSON, no other text.`;

    const { response, modelUsed } = await createChatCompletion({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '';
    const parsed = parseGroqJSON(content);

    if (parsed && parsed.dealVerdict) {
      return { ...parsed, engine: `groq_${modelUsed}`, status: 'success' };
    }

    return buildFallbackDealAnalysis(product, discountFromOriginal, discountFromAvg);
  } catch (error) {
    console.error('[GROQ] analyzeDeal error:', error.message);
    const discountFromOriginal = product.originalPrice > 0
      ? Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100) : 0;
    return buildFallbackDealAnalysis(product, discountFromOriginal, 0);
  }
};

/**
 * FEATURE 3 — Dashboard AI Insights
 * Generates curated AI insights across all products for the dashboard.
 */
const getDashboardInsights = async (products) => {
  try {
    if (!products || products.length === 0) {
      return buildFallbackInsights([]);
    }

    // Prepare a concise product summary for the prompt (limit tokens)
    const productSummaries = products.slice(0, 15).map((p) => ({
      title: p.title.substring(0, 50),
      currentPrice: p.currentPrice,
      originalPrice: p.originalPrice,
      dealScore: p.dealScore,
      lowestEver: p.lowestPriceEver,
      category: p.category,
      discount: p.originalPrice > 0
        ? Math.round(((p.originalPrice - p.currentPrice) / p.originalPrice) * 100)
        : 0,
      isAtLowest: p.currentPrice === p.lowestPriceEver,
    }));

    const prompt = `You are the AI engine of SmartDeal AI, an Indian e-commerce price intelligence platform.

Analyze these ${productSummaries.length} tracked products and generate smart dashboard insights.

Products:
${JSON.stringify(productSummaries, null, 2)}

Generate a JSON insights report with this EXACT structure:
{
  "headline": "<catchy 1-line AI insight headline about current market>",
  "summary": "<2 sentence summary of overall market situation>",
  "bestDealToday": {
    "title": "<product title>",
    "reason": "<why this is the best deal right now>",
    "currentPrice": <number>,
    "dealScore": <number>
  },
  "topPicks": [
    {
      "title": "<product>",
      "recommendation": "Buy Now" or "Wait",
      "reason": "<short reason>"
    },
    {
      "title": "<product>",
      "recommendation": "Buy Now" or "Wait", 
      "reason": "<short reason>"
    },
    {
      "title": "<product>",
      "recommendation": "Buy Now" or "Wait",
      "reason": "<short reason>"
    }
  ],
  "marketTrend": "Bullish" or "Bearish" or "Stable",
  "marketTrendReason": "<1 sentence explaining overall price trend>",
  "atLowestPriceCount": <number of products at lowest price>,
  "avgDealScore": <average deal score across all products, one decimal>,
  "hotCategory": "<category with best deals>",
  "aiTip": "<smart shopping tip for today>"
}

Return ONLY the JSON, no other text.`;

    const { response, modelUsed } = await createChatCompletion({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 900,
    });

    const content = response.choices[0]?.message?.content || '';
    const parsed = parseGroqJSON(content);

    if (parsed && parsed.headline) {
      return { ...parsed, engine: `groq_${modelUsed}`, status: 'success', generatedAt: new Date().toISOString() };
    }

    return buildFallbackInsights(products);
  } catch (error) {
    console.error('[GROQ] getDashboardInsights error:', error.message);
    return buildFallbackInsights(products);
  }
};

/**
 * FEATURE 4 — AI Chatbot
 * Context-aware conversational AI about products, prices, and deals.
 */
const chatWithAI = async (userMessage, context = {}) => {
  try {
    const systemPrompt = `You are SmartBot, the friendly AI assistant for SmartDeal AI — an intelligent Indian e-commerce price tracking platform.

You help users make smart buying decisions by analyzing price trends, deals, and market conditions.

Current platform context:
- Total products being tracked: ${context.totalProducts || 0}
- Products at lowest price ever: ${context.atLowestCount || 0}
- Best current deal score: ${context.bestDealScore || 'N/A'}
- Top category today: ${context.hotCategory || 'Electronics'}

Rules:
1. Be concise, friendly, and use emojis appropriately
2. Always reference Indian Rupee (₹) for prices
3. Focus on helping users save money and make smart buys
4. If asked about a specific product, give honest advice
5. Keep responses under 150 words
6. If you don't know something specific, give general advice`;

    const { response, modelUsed } = await createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || '';
    return {
      message: content,
      engine: `groq_${modelUsed}`,
      status: 'success',
    };
  } catch (error) {
    console.error('[GROQ] chatWithAI error:', error.message);
    return {
      message: '🤖 I\'m having trouble connecting right now. Please check prices manually or try again in a moment!',
      engine: 'fallback',
      status: 'error',
    };
  }
};

// ─────────────────────────────────────────────
// FALLBACK BUILDERS (when Groq is unavailable)
// ─────────────────────────────────────────────

const buildFallbackPrediction = (prices, currentPrice) => {
  const avg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : currentPrice;
  const trend = currentPrice < avg ? 'Stable' : currentPrice > avg * 1.05 ? 'Downward' : 'Stable';
  return {
    recommendation: trend === 'Downward' ? 'Wait' : 'Buy Now',
    confidence: 72,
    predictedPrice7Days: Math.round(currentPrice * 0.98),
    expectedChange: Math.round(currentPrice * -0.02),
    trend,
    advice: `Current price of ₹${currentPrice.toLocaleString('en-IN')} is ${trend === 'Downward' ? 'above' : 'near'} the historical average of ₹${Math.round(avg).toLocaleString('en-IN')}. Monitor for price changes.`,
    reasoning: 'Analysis based on historical price data using trend detection.',
    bestTimeToBy: trend === 'Downward' ? 'After 5-7 days' : 'Buy immediately',
    predictions: Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      price: Math.round(currentPrice * (1 + (Math.random() * 0.04 - 0.02))),
    })),
    engine: 'fallback',
    status: 'success',
  };
};

const buildFallbackDealAnalysis = (product, discountFromOriginal, discountFromAvg) => {
  const isGood = product.dealScore >= 7;
  return {
    dealVerdict: isGood ? 'Genuine Deal' : 'Average Deal',
    dealScore: product.dealScore,
    isGenuine: discountFromOriginal <= discountFromAvg + 15,
    actualDiscount: discountFromAvg,
    claimedDiscount: discountFromOriginal,
    inflationFactor: 'Price data analysis in progress.',
    verdict: isGood ? 'This appears to be a good deal based on pricing data.' : 'This is an average deal — consider waiting for better offers.',
    buyReason: isGood ? 'Price is competitive compared to historical data.' : 'Better prices may be available soon.',
    riskLevel: isGood ? 'Low' : 'Medium',
    aiDealScore: `${product.dealScore}/10`,
    engine: 'fallback',
    status: 'success',
  };
};

const buildFallbackInsights = (products) => {
  const atLowest = products.filter((p) => p.currentPrice === p.lowestPriceEver);
  const best = products.sort((a, b) => b.dealScore - a.dealScore)[0];
  return {
    headline: '🔍 AI analysis in progress — check back shortly!',
    summary: `Currently tracking ${products.length} products. ${atLowest.length} products are at their lowest prices ever.`,
    bestDealToday: best ? { title: best.title, reason: 'Highest deal score', currentPrice: best.currentPrice, dealScore: best.dealScore } : null,
    topPicks: products.slice(0, 3).map((p) => ({ title: p.title, recommendation: p.dealScore >= 7 ? 'Buy Now' : 'Wait', reason: p.dealScore >= 7 ? 'Great deal score' : 'Price may drop soon' })),
    marketTrend: 'Stable',
    marketTrendReason: 'Prices are holding steady across tracked categories.',
    atLowestPriceCount: atLowest.length,
    avgDealScore: products.length > 0 ? parseFloat((products.reduce((s, p) => s + p.dealScore, 0) / products.length).toFixed(1)) : 0,
    hotCategory: 'Electronics',
    aiTip: 'Always compare the current price against historical lows before making a purchase!',
    engine: 'fallback',
    status: 'success',
    generatedAt: new Date().toISOString(),
  };
};

module.exports = {
  predictPriceWithGroq,
  analyzeDeal,
  getDashboardInsights,
  chatWithAI,
};
