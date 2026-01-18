const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    firebaseUid: { type: String, unique: true, required: true }, // Ensure this exists for lookups
    businessName: { type: String }, // Added this field
    authProvider: { type: String, enum: ["google", "email"], default: "google" },
    phoneNumber: { type: String, unique: true, sparse: true },
    phoneVerified: { type: Boolean, default: false },
    country: { type: String, default: "India" },
    expertSystemID: { type: mongoose.Schema.Types.ObjectId, ref: "ExpertSystem" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);