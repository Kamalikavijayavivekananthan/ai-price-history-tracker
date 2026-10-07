const cron = require('node-cron');
const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');
const Alert = require('../models/Alert');
const { sendPriceAlert } = require('../services/notificationService');

/**
 * Simulates a single price tracking cycle:
 * 1. Fluctuates prices of all tracked products to simulate real e-commerce updates.
 * 2. Saves historical records.
 * 3. Scans alert rules and dispatches notifications for target prices reached.
 */
const runPriceTrackingCycle = async () => {
  console.log('[CRON] Starting price tracking cycle...');
  try {
    const products = await Product.find({});
    let updateCount = 0;

    for (const product of products) {
      // Create price history entry of the CURRENT price before updating it
      const historyLog = new PriceHistory({
        productId: product._id,
        storePrices: product.stores.map(s => ({ storeName: s.storeName, price: s.price })),
        date: new Date(),
      });
      await historyLog.save();

      // Simulate a price change: -5% to +5% fluctuation for all stores
      let updated = false;

      product.stores.forEach(store => {
        const percentChange = (Math.random() * 0.1 - 0.05); // -0.05 to +0.05
        const priceDifference = Math.round(store.price * percentChange);
        
        // Only apply if it shifts price by more than ₹10
        if (Math.abs(priceDifference) > 10) {
          store.price = Math.max(100, store.price + priceDifference); // don't go below ₹100
          updated = true;
        }
      });
      
      if (updated) {
        await product.save(); // pre-save recalculates high/low/dealScore
        updateCount++;
      }
    }

    console.log(`[CRON] Updated simulated prices for ${updateCount}/${products.length} products.`);

    // Check alerts
    const activeAlerts = await Alert.find({ isTriggered: false })
      .populate('productId')
      .populate('userId');

    let triggeredCount = 0;

    for (const alert of activeAlerts) {
      if (!alert.productId || !alert.userId) continue;

      const currentLowestPrice = Math.min(...alert.productId.stores.map(s => s.price));
      const targetPrice = alert.targetPrice;

      if (currentLowestPrice <= targetPrice) {
        await sendPriceAlert({
          userId: alert.userId._id,
          userEmail: alert.userId.email,
          userName: alert.userId.name,
          product: alert.productId,
          targetPrice: alert.targetPrice,
        });

        alert.isTriggered = true;
        await alert.save();
        triggeredCount++;
      }
    }

    console.log(`[CRON] Scan complete. Alerts triggered: ${triggeredCount}/${activeAlerts.length}.`);
  } catch (error) {
    console.error(`[CRON ERROR] Failed during tracking cycle: ${error.message}`);
  }
};

/**
 * Initializes the background cron job scheduler
 */
const initCronJobs = () => {
  // Run every 1 minute
  cron.schedule('*/1 * * * *', () => {
    runPriceTrackingCycle();
  });
  console.log('[CRON] Price update scheduler initialized (configured for every 1 minute).');
};

module.exports = {
  initCronJobs,
  runPriceTrackingCycle,
};
