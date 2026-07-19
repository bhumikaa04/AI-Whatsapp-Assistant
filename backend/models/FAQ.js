// models/FAQ.js
const mongoose = require("mongoose");
const { normalize } = require("../utils/normalize");
const { generateEmbedding } = require("../services/embedding.service");

const faqSchema = new mongoose.Schema(
  {
    expertSystemID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpertSystem",
      required: true,
      index: true,
    },
    question: { type: String, required: true },
    // 🚀 NEW: Standardized lookup field
    normalizedQuestion: { type: String, index: true }, 
    answer: { type: String, required: true },
    keywords: { type: [String], default: [] },
    priority: { type: Number, default: 1 },
    
    // 🚀 NEW: Store the vectorized coordinates directly
    embedding: {
      type: [Number], 
      default: []
    }
  },
  { timestamps: true }
);

// Compound index to drastically speed up Milestone 2's exact match lookup
faqSchema.index({ expertSystemID: 1, normalizedQuestion: 1 });

// models/FAQ.js

/**
 * Mongoose Pre-Save Document Middleware hook
 * Intercepts updates/creations to automate normalization and vector spacing.
 */
faqSchema.pre("save", async function () {
  // 1. Automatically handle normalization if the text question has changed
  if (this.isModified("question") || this.isNew) {
    this.normalizedQuestion = normalize(this.question);
    
    // 2. Automatically generate vectors without any manual controller boilerplate code
    try {
      if (this.normalizedQuestion) {
        this.embedding = await generateEmbedding(this.normalizedQuestion);
      }
    } catch (err) {
      console.error("Automated Mongoose hook failed to build embedding:", err);
    }
  }
});

const FAQ = mongoose.model("FAQ", faqSchema);
module.exports = FAQ;