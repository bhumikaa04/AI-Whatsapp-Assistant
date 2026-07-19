// models/Conversation.js
const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    expertSystemID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpertSystem",
      required: true,
      index: true
    },
    customerPhone: {
      type: String,
      required: true,
      index: true
    },
    messages: [
      {
        sender: { type: String, enum: ["user", "bot"], required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);