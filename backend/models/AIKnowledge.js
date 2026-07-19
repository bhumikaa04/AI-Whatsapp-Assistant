const mongoose = require("mongoose");

const AIKnowledgeSchema = new mongoose.Schema({
  expertSystemID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Change if needed
    required: true
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

  answer: {
    type: String,
    required: true
  },

  usageCount: {
    type: Number,
    default: 1
  },

  source: {
    type: String,
    enum: ["ollama_review", "manual_upload"],
    default: "ollama_review"
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

AIKnowledgeSchema.index({
  expertSystemID: 1,
  normalizedQuestion: 1
});

module.exports = mongoose.model(
  "AIKnowledge",
  AIKnowledgeSchema
);