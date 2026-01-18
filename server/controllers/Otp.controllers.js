const Otp = require("../models/Otp");
const User = require("../models/User");
const twilioService = require("../services/twilio.service");
const rateLimit = require("express-rate-limit");

// Rate limiting middleware for OTP requests
exports.otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Max 3 requests per IP
  message: {
    success: false,
    message: "Too many OTP requests. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Send OTP to phone number
exports.sendOtp = async (req, res) => {
  try {
    const { phoneNumber, channel = 'sms' } = req.body;
    const userId = req.user?.id; // From auth middleware

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    // Validate phone number format
    const validatedPhone = twilioService.validatePhoneNumber(phoneNumber);
    if (!validatedPhone) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format"
      });
    }

    // Check if phone already verified by another user
    const existingUser = await User.findOne({ 
      phoneNumber: validatedPhone, 
      phoneVerified: true,
      _id: { $ne: userId } // Exclude current user
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "This phone number is already registered"
      });
    }

    // Delete any existing OTP for this number
    await Otp.deleteMany({ phoneNumber: validatedPhone });

    // Generate OTP
    const otp = twilioService.generateOTP();

    // Save OTP to database
    const otpRecord = await Otp.create({
      phoneNumber: validatedPhone,
      otp,
      userId, // Optional: link to user
    });

    // Send OTP via selected channel
    let result;
    if (channel === 'whatsapp') {
      result = await twilioService.sendWhatsAppOTP(validatedPhone, otp);
    } else {
      result = await twilioService.sendOTP(validatedPhone, otp);
    }

    if (!result.success) {
      throw new Error("Failed to send OTP");
    }

    // NEVER send OTP in response (security)
    res.json({
      success: true,
      message: `OTP sent successfully via ${channel}`,
      // For development/testing only - remove in production
      ...(process.env.NODE_ENV === 'development' && { otp })
    });

  } catch (error) {
    console.error("Send OTP error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP"
    });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    const userId = req.user?.id;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required"
      });
    }

    const validatedPhone = twilioService.validatePhoneNumber(phoneNumber);

    // Find OTP record
    const otpRecord = await Otp.findOne({
      phoneNumber: validatedPhone,
      otp,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    // Check if expired
    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "OTP has expired"
      });
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "Too many attempts. Please request a new OTP"
      });
    }

    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();

    // Verify OTP
    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Incorrect OTP"
      });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Update user's phone verification status if user ID exists
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        phoneNumber: validatedPhone,
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
      });
    }

    // Clean up OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({
      success: true,
      message: "Phone number verified successfully",
      phoneNumber: validatedPhone,
      verified: true,
    });

  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP"
    });
  }
};

// Resend OTP
exports.resendOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    // Delete existing OTP
    await Otp.deleteMany({ phoneNumber });

    // Call sendOTP logic
    req.body.channel = req.body.channel || 'sms';
    return exports.sendOtp(req, res);

  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP"
    });
  }
};