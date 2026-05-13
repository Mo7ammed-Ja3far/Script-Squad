const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
  phone: { type: String },
  
  // Doctor specific fields
  department: { type: String },
  specialization: { type: String },
  consultationFee: { type: Number },
  bio: { type: String },
  experienceYears: { type: Number },
  credentials: [{
    degree: { type: String },
    institution: { type: String },
    year: { type: Number }
  }],
  workingHours: [{
    dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    startTime: { type: String }, // e.g., "09:00"
    endTime: { type: String },   // e.g., "17:00"
    slotDuration: { type: Number, default: 20 }, // duration in minutes
    isDayOff: { type: Boolean, default: false }
  }]
}, { timestamps: true });

// Indexing for faster queries (especially for doctors by department)
userSchema.index({ role: 1, department: 1 });

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
