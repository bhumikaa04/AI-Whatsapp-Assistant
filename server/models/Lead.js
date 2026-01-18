const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
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
  email: String,
  source: {
    type: String,
    enum: ['whatsapp', 'website', 'manual'],
    default: 'whatsapp'
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
    default: 'new'
  },
  notes: String,
  tags: [String],
  lastContacted: Date,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

leadSchema.index({ expertSystemId: 1, status: 1 });
leadSchema.index({ expertSystemId: 1, createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);