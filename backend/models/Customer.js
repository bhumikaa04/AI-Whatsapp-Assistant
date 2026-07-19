// models/Customer.js
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    expertSystemID: { type: mongoose.Schema.Types.ObjectId, ref: "ExpertSystem", required: true },
    phone: { type: String, required: true, index: true },
    name: { type: String, default: "Anonymous Lead" },
    intent: { 
      type: String, 
      enum: ["New Lead", "Interested", "Product Inquiry", "Support Request", "Complaint", "Converted", "Cold Lead", "Spam"],
      default: "New Lead" 
    },
    leadScore: { type: Number, default: 10, min: 0, max: 100 },
    totalMessages: { type: Number, default: 0 },
    lastInteraction: { type: Date, default: Date.now },
    lastAnalysisCount: { type: Number, default: 0 },  // Tracks totalMessages at last LLM run
    avatarSeed: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);