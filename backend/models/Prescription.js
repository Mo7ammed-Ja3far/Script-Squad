const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  medications: [{
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true },
    instructions: { type: String, trim: true }
  }],
  notes: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

prescriptionSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
