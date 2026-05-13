const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['waiting', 'in-progress', 'completed', 'cancelled'], 
    default: 'waiting' 
  },
  queueNumber: { type: Number, required: true }
}, { timestamps: true });

// Ensure patients are sorted by queueNumber properly when queried
queueSchema.index({ doctor: 1, date: 1, queueNumber: 1 });

module.exports = mongoose.model('Queue', queueSchema);
