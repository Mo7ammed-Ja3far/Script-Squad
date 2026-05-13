const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // Store date as string YYYY-MM-DD to simplify specific day querying
  date: { type: String, required: true },
  // Store time as string HH:MM
  time: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'], 
    default: 'pending' 
  },
  type: { type: String, enum: ['regular', 'follow-up'], default: 'regular' },
  parentSession: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }, // If it's a follow-up
  notes: { type: String }
}, { timestamps: true });

// Compound index to enforce uniqueness and prevent double-booking at the DB layer
appointmentSchema.index({ doctor: 1, date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
