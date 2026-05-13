const mongoose = require('mongoose');

const emrSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  chronicDiseases: [{ type: String }],
  surgicalHistory: [{ type: String }],
  allergies: [{ type: String }],
  history: [{
    date: { type: Date, default: Date.now },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    diagnosis: { type: String, required: true },
    durationMinutes: { type: Number },
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('EMR', emrSchema);
