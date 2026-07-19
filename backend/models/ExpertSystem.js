const mongoose = require("mongoose");

const expertSystemSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: String,
      ref: "User",
      required: true,
    },

    ownerPhone: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      default: "Default Expert System",
    },

    domain: {
      type: String,
      default: "general",
    },

    fallbackType: {
      type: String,
      enum: ["faq_only", "gpt"],
      default: "faq_only",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExpertSystem", expertSystemSchema);
