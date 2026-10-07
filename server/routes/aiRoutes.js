const express = require('express');
const {
  getProductAIAnalysis,
  getDashboardAIInsights,
  chatMessage,
} = require('../controllers/aiController');

const router = express.Router();

// GET /api/ai/insights  — Dashboard AI panel (all products)
router.get('/insights', getDashboardAIInsights);

// GET /api/ai/product/:id  — Full AI analysis for a single product
router.get('/product/:id', getProductAIAnalysis);

// POST /api/ai/chat  — AI Chatbot message
router.post('/chat', chatMessage);

module.exports = router;
