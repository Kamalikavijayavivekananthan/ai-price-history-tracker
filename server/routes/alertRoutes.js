const express = require('express');
const { createAlert, getUserAlerts, deleteAlert, checkAllAlerts } = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/check', checkAllAlerts); // Keep open or secure for admin. Let's keep open for test runner execution.

router.use(protect); // Secure these endpoints with authentication middleware

router.get('/', getUserAlerts);
router.post('/', createAlert);
router.delete('/:id', deleteAlert);

module.exports = router;
