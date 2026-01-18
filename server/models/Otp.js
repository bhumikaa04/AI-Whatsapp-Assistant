const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    default: Date.now,
    index: { expires: '5m' }, // Auto-delete after 5 minutes
  },
  verified: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3, // Max 3 attempts
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model("Otp", otpSchema);