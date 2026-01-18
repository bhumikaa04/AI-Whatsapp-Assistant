const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  expertSystemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertSystem',
    required: true
  },
  whatsappNumber: {
    type: String,
    required: true
  },
  contactName: String,
  lastMessage: String,
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'pending'],
    default: 'active'
  },
  tags: [String],
  isLead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

conversationSchema.index({ expertSystemId: 1, whatsappNumber: 1 });
conversationSchema.index({ expertSystemId: 1, lastMessageTime: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);