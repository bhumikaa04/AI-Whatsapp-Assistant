const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  expertSystemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertSystem',
    required: true
  },
  direction: {
    type: String,
    enum: ['incoming', 'outgoing'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'document', 'button'],
    default: 'text'
  },
  responseType: {
    type: String,
    enum: ['faq', 'gpt', 'fallback', 'human'],
    default: 'faq'
  },
  faqMatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQ'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

messageSchema.index({ expertSystemId: 1, timestamp: -1 });
messageSchema.index({ conversationId: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);