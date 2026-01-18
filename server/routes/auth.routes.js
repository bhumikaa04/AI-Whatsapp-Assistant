// server/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const authController = require("../controllers/auth.controllers");

// Sync Firebase user with backend
router.post("/sync-user", authMiddleware, authController.syncUser);

// Twilio OTP routes (protected - user must be logged in)
router.post("/send-otp", authMiddleware, authController.sendOtp);
router.post("/verify-otp", authMiddleware, authController.verifyOtp);
router.post("/resend-otp", authMiddleware, authController.resendOtp);

module.exports = router;