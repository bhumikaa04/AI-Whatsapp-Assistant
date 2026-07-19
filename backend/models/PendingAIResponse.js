const mongoose = require("mongoose");

const PendingAIResponseSchema = new mongoose.Schema({
  expertSystemID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ExpertSystem",
    required: true
  },
  question: { type: String, required: true },
  normalizedQuestion: { type: String, required: true },
  questionEmbedding: {
    type: [Number], // Storing vectors as arrays of floats
    required: true
  },
  generatedAnswer: { type: String, required: true },
  confidence: { type: Number, default: 0.0 },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }
}, { timestamps: true }); // Automatically provides `createdAt`

// Index for speed when admin processes queues per system
PendingAIResponseSchema.index({ expertSystemID: 1, status: 1 });

module.exports = mongoose.model(
    "PendingAIResponse",
    PendingAIResponseSchema
);