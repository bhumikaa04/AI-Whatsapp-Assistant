const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  expertSystemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertSystem',
    required: true
  },
  type: {
    type: String,
    enum: ['new_conversation', 'new_lead', 'faq_answered', 'gpt_fallback', 'upsell_suggested', 'bot_paused', 'bot_resumed'],
    required: true
  },
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

activitySchema.index({ expertSystemId: 1, timestamp: -1 });

module.exports = mongoose.model('Activity', activitySchema);