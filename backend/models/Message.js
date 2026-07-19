import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    required: true
  },

  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation"
  },

  text: String,

  sender: {
    type: String,
    enum: ["user", "bot", "admin"],
    required: true
  },

  messageType: {
    type: String,
    enum: [
      "text",
      "image",
      "document",
      "faq-response",
      "gpt-response",
      "fallback"
    ]
  },

  faqMatched: String,
  confidence: Number,

  intent: String, // store detected intent
  intentConfidence: Number,

  isUpsell: Boolean,
  failedMatch: Boolean,

  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30 // 30 days TTL
  }
});

export default mongoose.model("Message", messageSchema);