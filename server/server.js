const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initCronJobs, runPriceTrackingCycle } = require('./cronjobs/priceCron');
const seedDatabase = require('./seeder');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to Database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Test / Admin endpoint to force simulated cron execution
app.post('/api/trigger-cron', async (req, res) => {
  try {
    await runPriceTrackingCycle();
    return res.json({
      success: true,
      message: 'Simulated price fluctuation and alert check triggered successfully!',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('AI Price History Tracker API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

  // Seed products automatically if database is empty
  try {
    await seedDatabase();
  } catch (error) {
    console.error(`Automatic seeding failed: ${error.message}`);
  }
  
  // Start background price update cron scheduler
  initCronJobs();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
