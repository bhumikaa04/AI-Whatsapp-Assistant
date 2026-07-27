const mongoose = require("mongoose");

const PendingAIResponseSchema = new mongoose.Schema({
  expertSystemID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ExpertSystem",
    required: true,
    index: true
  },

  // Where this suggestion came from
  source: {
    type: String,
    enum: [
      "business_profile",
      "ollama",
      "manual"
    ],
    default: "business-profile"
  },

  // Category for UI grouping
  category: {
    type: String,
    enum: [
      "general",
      "product",
      "service",
      "pricing",
      "policy",
      "objection",
      "lead_qualification",
      "upsell",
      "greeting",
      "closing"
    ],
    default: "general"
  },

  question: {
    type: String,
    required: true
  },

  normalizedQuestion: {
    type: String,
    required: true
  },

  questionEmbedding: {
    type: [Number],
    default: []
  },

  generatedAnswer: {
    type: String,
    required: true
  },

  confidence: {
    type: Number,
    default: 0
  },

  // Explain why AI generated this
  reasoning: {
    type: String,
    default: ""
  },

  status: {
    type: String,
    enum: [
      "pending",
      "approved",
      "edited",
      "rejected"
    ],
    default: "pending"
  },

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }

}, { timestamps: true });

PendingAIResponseSchema.index({
  expertSystemID: 1,
  status: 1
});

module.exports = mongoose.model(
  "PendingAIResponse",
  PendingAIResponseSchema
);