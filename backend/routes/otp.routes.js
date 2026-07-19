// server/routes/auth.routes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth");
const authController = require("../controllers/auth.controllers");
const otpController = require("../controllers/Otp.controllers")

// Sync Firebase user
router.post("/sync-user", authMiddleware, authController.syncUser);

// OTP routes
router.post("/send-otp", authMiddleware, otpController.sendOtp);
router.post("/verify-otp", authMiddleware, otpController.verifyOtp); 

module.exports = router;
