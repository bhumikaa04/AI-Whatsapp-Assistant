// models/Lead.js
const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: String,
  firstMessage: String,
  lastActive: { type: Date, default: Date.now },
  leadSource: { 
    type: String, 
    enum: ["WhatsApp", "Website", "Referral", "Other"],
    default: "WhatsApp"
  },
  status: {
    type: String,
    enum: ["New", "Engaged", "Converted", "Unresponsive"],
    default: "New"
  },
  tags: [{
    type: String,
    enum: ["Interested", "FAQ-only", "Hot lead", "Price-sensitive", "Technical"]
  }],
  lastIntent: String,
  intents: [{
    intent: String,
    confidence: Number,
    detectedAt: { type: Date, default: Date.now }
  }],
  notes: [{
    content: String,
    createdBy: String,
    createdAt: { type: Date, default: Date.now }
  }],
  metadata: {
    location: String,
    language: String,
    deviceInfo: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ✅ Use CommonJS export to match backend standard
module.exports = mongoose.model("Lead", leadSchema);