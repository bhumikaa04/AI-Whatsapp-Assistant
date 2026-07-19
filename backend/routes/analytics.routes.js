const express = require('express');
const router = express.Router();
const User = require('../models/User');
// Assuming a Message model exists
// const Message = require('../models/Message'); 

router.get('/performance', async (req, res) => {
  try {
    // Example logic:
    // const total = await Message.countDocuments();
    // const aiResolved = await Message.countDocuments({ sender: 'ai' });
    
    // Placeholder response
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