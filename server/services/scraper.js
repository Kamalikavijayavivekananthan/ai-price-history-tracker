const PriceHistory = require('../models/PriceHistory');

/**
 * Parses e-commerce URLs or generates realistic mock data
 * @param {string} url - Product e-commerce URL
 * @param {string} title - Optional title if manual creation
 * @param {number} currentPrice - Optional starting price if manual creation
 * @returns {object} Scraped or simulated product data
 */
const fetchProductDetails = async (url, title, currentPrice, category) => {
  // Determine e-commerce platform
  let source = 'manual';
  if (url.includes('amazon')) source = 'amazon';
  else if (url.includes('flipkart')) source = 'flipkart';

  // Base mockup images for categories
  const mockImages = {
    Mobiles: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1565849906660-bf12415d590e?auto=format&fit=crop&w=600&q=80'
    ],
    Laptops: [
      'https://images.unsplash.com/photo-1496181130204-7552cc14ac1a?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80'
    ],
    Headphones: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80'
    ],
    default: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
    ]
  };

  const selectedCategory = category || 'Mobiles';
  const imgList = mockImages[selectedCategory] || mockImages['default'];
  const imageUrl = imgList[Math.floor(Math.random() * imgList.length)];

  // Default values
  const defaultTitle = title || `Premium ${selectedCategory.slice(0, -1)} Model`;
  const defaultPrice = currentPrice || Math.floor(Math.random() * 50000) + 5000;
  // Make original price 10% to 30% higher to simulate discount
  const discountMultiplier = 1 + (Math.random() * 0.2 + 0.1); 
  const originalPrice = Math.round((defaultPrice * discountMultiplier) / 100) * 100;

  return {
    title: defaultTitle,
    description: `High-quality tracking product matching e-commerce standards. Monitored with AI predictions. Category: ${selectedCategory}.`,
    url,
    imageUrl,
    brand: defaultTitle.split(' ')[0] || 'Generic',
    category: selectedCategory,
    currentPrice: defaultPrice,
    originalPrice,
    scrapeSource: source,
  };
};

/**
 * Generates and saves price history logs for the past 30 days
 * @param {string} productId - Product Mongoose ID
 * @param {Array} currentStores - Final stores array
 */
const generateHistoricalData = async (productId, currentStores) => {
  const history = [];
  const now = new Date();
  
  let simulatedStores = currentStores.map(s => ({
    storeName: s.storeName,
    price: Math.round((s.price * (1 + (Math.random() * 0.15 - 0.05))) / 10) * 10
  }));
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    
    // Simulate fluctuations
    if (i > 0) {
      simulatedStores = simulatedStores.map(s => {
        if (Math.random() < 0.15) {
          return { ...s, price: Math.round((s.price * (1 + (Math.random() * 0.1 - 0.05))) / 10) * 10 };
        }
        return s;
      });
    }
    
    // Last day must exactly match the current exact final prices
    if (i === 0) {
      simulatedStores = currentStores.map(s => ({ storeName: s.storeName, price: s.price }));
    }

    history.push({
      productId,
      storePrices: simulatedStores.map(s => ({ storeName: s.storeName, price: s.price })),
      date,
    });
  }

  await PriceHistory.insertMany(history);
  console.log(`Generated ${history.length} historical data points for Product ID: ${productId}`);
};

module.exports = {
  fetchProductDetails,
  generateHistoricalData,
};
