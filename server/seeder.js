const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const PriceHistory = require('./models/PriceHistory');
const { fetchProductDetails, generateHistoricalData } = require('./services/scraper');

dotenv.config();

const baseStores = ['Amazon', 'Flipkart', 'Croma', 'Reliance Digital', 'Tata Cliq', 'Vijay Sales'];

const generateStoresData = (basePrice, title) => {
  return baseStores.map(store => {
    // Add some random variation between -2% to +5% for each store
    const variation = (Math.random() * 0.07) - 0.02; 
    return {
      storeName: store,
      price: Math.round(basePrice * (1 + variation)),
      link: `https://${store.replace(/\s/g, '').toLowerCase()}.com/search?q=${encodeURIComponent(title)}`
    };
  });
};

const products = [
  { title: 'iPhone 16 Pro (256GB)', description: 'Apple iPhone 16 Pro with A18 Pro chip.', brand: 'Apple', category: 'Mobiles', imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80', stores: generateStoresData(119900, 'iPhone 16 Pro') },
  { title: 'Samsung Galaxy S24 Ultra', description: 'Samsung Galaxy S24 Ultra with Galaxy AI.', brand: 'Samsung', category: 'Mobiles', imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80', stores: generateStoresData(124999, 'Samsung Galaxy S24 Ultra') },
  { title: 'MacBook Air M3 (13-inch)', description: 'Thin MacBook Air powered by M3 chip.', brand: 'Apple', category: 'Laptops', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80', stores: generateStoresData(104900, 'MacBook Air M3') },
  { title: 'Sony WH-1000XM5 Headphones', description: 'Industry-leading noise-canceling headphones.', brand: 'Sony', category: 'Headphones', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', stores: generateStoresData(24990, 'Sony WH-1000XM5') },
  { title: 'Bose QuietComfort Ultra', description: 'Bose premium wireless headphones.', brand: 'Bose', category: 'Headphones', imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80', stores: generateStoresData(32900, 'Bose QuietComfort Ultra') },
  { title: 'Google Pixel 8 Pro', description: 'Google Pixel 8 Pro with Google Tensor G3.', brand: 'Google', category: 'Mobiles', imageUrl: 'https://images.unsplash.com/photo-1696446702183-f36bc932a382?auto=format&fit=crop&w=600&q=80', stores: generateStoresData(94999, 'Google Pixel 8 Pro') },
  { title: 'iPad Pro 11-inch (M4)', description: 'The new iPad Pro with M4 chip.', brand: 'Apple', category: 'Tablets', imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80', stores: generateStoresData(99900, 'iPad Pro 11-inch') },
  { title: 'Sony PlayStation 5 Console', description: 'Next-gen gaming with lightning-fast loading.', brand: 'Sony', category: 'Gaming', imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=600&q=80', stores: generateStoresData(44990, 'PlayStation 5') },
  { title: 'Nintendo Switch OLED', description: 'Nintendo Switch with a vibrant 7-inch OLED screen.', brand: 'Nintendo', category: 'Gaming', imageUrl: 'https://images.unsplash.com/photo-1635315570075-8eb34424ce17?auto=format&fit=crop&w=600&q=80', stores: generateStoresData(29990, 'Nintendo Switch OLED') },
  { title: 'Apple Watch Series 9', description: 'Advanced health tracking.', brand: 'Apple', category: 'Wearables', imageUrl: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=600&q=80', stores: generateStoresData(39900, 'Apple Watch Series 9') },
  { title: 'Samsung Galaxy Watch 6', description: 'Track your health and sleep.', brand: 'Samsung', category: 'Wearables', imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&q=80', stores: generateStoresData(24999, 'Samsung Galaxy Watch 6') },
  { title: 'LG C3 55-inch OLED TV', description: 'OLED evo technology for brilliant picture.', brand: 'LG', category: 'TVs', imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80', stores: generateStoresData(119990, 'LG C3 OLED TV') },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to Database for seeding...');

        // Only seed when products collection is empty
    const existingProducts = await Product.countDocuments();

   if (existingProducts > 0) {
  console.log(`Products already exist (${existingProducts}). Skipping seed.`);
  return;
}

    console.log('Products collection is empty. Starting seed...');

    // Fetch and save each product
    for (const data of products) {
      // Create product
      const product = new Product(data);
      await product.save(); // triggers pre-save lowest/highest/dealScore calculations

      // Generate history
      await generateHistoricalData(product._id, product.stores);
    }

   console.log(`Seeder successfully executed! Seeded ${products.length} products with 30-day price histories.`);
return;
  } catch (error) {
    console.error(`Seeder failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = seedDatabase;

if (require.main === module) {
  seedDatabase();
}
