const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    expertSystemID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpertSystem",
      required: true,
      index: true,
    },

    question: {
      type: String,
      required: true,
    },

    answer: {
      type: String,
      required: true,
    },

    keywords: {
      type: [String],
      default: [],
    },

    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 20,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FAQ", faqSchema);
