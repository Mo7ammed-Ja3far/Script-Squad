const mongoose = require('mongoose');

const emrSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null],
    default: null
  },
  height: { type: Number },
  weight: { type: Number },
  chronicDiseases: [{ type: String, trim: true }],
  surgicalHistory: [{ type: String, trim: true }],
  allergies: [{ type: String, trim: true }],
  history: [{
    date: { type: Date, default: Date.now },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    diagnosis: { type: String, required: true, trim: true },
    durationMinutes: { type: Number },
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
    notes: { type: String, trim: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('EMR', emrSchema);
