// routes/whatsapp.routes.js
const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controllers'); // Make sure this path points correctly to your controller

// 💡 Match the path exactly: this handles POST requests to /whatsapp/incoming
// Note: Do NOT guard this specific route with your Firebase auth token middleware!
// Twilio hits this URL completely from the outside, so it cannot provide a client JWT token.
router.post('/incoming', whatsappController.incomingMsgs);

module.exports = router;