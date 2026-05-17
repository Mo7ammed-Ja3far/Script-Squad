const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  whatsappNumber: {
    type: String,
    required: true,
    index: true
  },
  code: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['registration', 'password_reset'],
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600
  }
});

otpSchema.index({ whatsappNumber: 1, purpose: 1 });

module.exports = mongoose.model('OTP', otpSchema);
