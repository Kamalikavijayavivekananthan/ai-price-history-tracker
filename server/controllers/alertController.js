const Alert = require('../models/Alert');
const Product = require('../models/Product');
const { sendPriceAlert } = require('../services/notificationService');

// @desc    Create a price drop alert rule
// @route   POST /api/alerts
// @access  Private
exports.createAlert = async (req, res) => {
  try {
    const { productId, targetPrice } = req.body;

    if (!productId || !targetPrice || isNaN(targetPrice)) {
      return res.status(400).json({ success: false, message: 'Please provide a product ID and target price' });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Create the alert rule
    const alert = new Alert({
      userId: req.user.id,
      productId,
      targetPrice: Number(targetPrice),
      isTriggered: false,
    });

    await alert.save();

    return res.status(201).json({
      success: true,
      message: 'Price drop alert configured successfully',
      alert,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error creating alert' });
  }
};

// @desc    Get all active alerts for current user
// @route   GET /api/alerts
// @access  Private
exports.getUserAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user.id })
      .populate('productId')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error retrieving alerts' });
  }
};

// @desc    Delete/Cancel a price alert
// @route   DELETE /api/alerts/:id
// @access  Private
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert rule not found or unauthorized' });
    }

    return res.json({
      success: true,
      message: 'Alert cancelled successfully',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error cancelling alert' });
  }
};

// @desc    Trigger checking of price alerts manually (for administration and testing)
// @route   POST /api/alerts/check
// @access  Public
exports.checkAllAlerts = async (req, res) => {
  try {
    // Find all active, untriggered alert rules
    const activeAlerts = await Alert.find({ isTriggered: false })
      .populate('productId')
      .populate('userId');

    let triggeredCount = 0;

    for (const alert of activeAlerts) {
      if (!alert.productId || !alert.userId) continue;

      const currentPrice = alert.productId.currentPrice;
      const targetPrice = alert.targetPrice;

      // If price has dropped to or below the target threshold
      if (currentPrice <= targetPrice) {
        // Send alert
        await sendPriceAlert({
          userId: alert.userId._id,
          userEmail: alert.userId.email,
          userName: alert.userId.name,
          product: alert.productId,
          targetPrice: alert.targetPrice,
        });

        // Mark alert rule as triggered
        alert.isTriggered = true;
        await alert.save();
        triggeredCount++;
      }
    }

    return res.json({
      success: true,
      message: `System scanned active rules. Triggered ${triggeredCount} email/in-app alert(s).`,
      scannedCount: activeAlerts.length,
      triggeredCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error running alert check' });
  }
};
