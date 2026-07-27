const express = require('express');
const router = express.Router();
const { getAnalyticsData } = require('../controllers/analytics.controllers');

// GET /analytics?expertSystemID=...
router.get('/', getAnalyticsData);

// GET /analytics/performance (Your existing placeholder/extra endpoint)
router.get('/performance', async (req, res) => {
  try {
    res.json({
      total: 1250,
      aiResolved: 1100,
      fallbacks: 150
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;