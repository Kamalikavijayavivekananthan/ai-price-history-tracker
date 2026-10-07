const express = require('express');
const {
  getProducts,
  getProductById,
  addProduct,
  deleteProduct,
  getProductPrediction,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/').get(getProducts).post(protect, addProduct);
router.route('/:id').get(getProductById).delete(protect, authorize('admin'), deleteProduct);
router.route('/:id/predict').get(getProductPrediction);

module.exports = router;
