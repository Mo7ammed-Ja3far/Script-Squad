const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true }, // e.g., "every 8 hours"
    duration: { type: String, required: true },  // e.g., "7 days"
    quantity: { type: Number, required: true }
  }],
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
