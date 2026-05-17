const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['regular', 'follow-up'],
    default: 'regular'
  },
  parentSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  notes: { type: String, trim: true },
  rescheduledFrom: {
    date: { type: String },
    time: { type: String }
  },
  rescheduledAt: { type: Date }
}, { timestamps: true });

appointmentSchema.index({ doctor: 1, date: 1, time: 1 }, { unique: true });
appointmentSchema.index({ patient: 1, status: 1 });
appointmentSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
