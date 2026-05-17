require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const EMR = require('./models/EMR');
const Prescription = require('./models/Prescription');
const Queue = require('./models/Queue');

const connectDB = require('./config/db');

const doctors = [
  {
    name: 'Dr. Sarah Mitchell',
    email: 'sarah.mitchell@clinicflow.com',
    password: 'Doctor@123',
    role: 'doctor',
    phone: '+201001234567',
    whatsappNumber: '+201001234567',
    isActive: true,
    isWhatsappVerified: true,
    department: 'Cardiology',
    specialization: 'Interventional Cardiology',
    consultationFee: 300,
    bio: 'Board-certified cardiologist with 15 years of experience.',
    experienceYears: 15,
    workingHours: [
      { dayOfWeek: 0, isDayOff: true },
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDuration: 20 },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', slotDuration: 20 },
      { dayOfWeek: 3, startTime: '09:00', endTime: '13:00', slotDuration: 20 },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', slotDuration: 20 },
      { dayOfWeek: 5, startTime: '10:00', endTime: '14:00', slotDuration: 20 },
      { dayOfWeek: 6, isDayOff: true }
    ]
  },
  {
    name: 'Dr. James Okafor',
    email: 'james.okafor@clinicflow.com',
    password: 'Doctor@123',
    role: 'doctor',
    phone: '+201009876543',
    whatsappNumber: '+201009876543',
    isActive: true,
    isWhatsappVerified: true,
    department: 'General Medicine',
    specialization: 'Internal Medicine',
    consultationFee: 200,
    bio: 'General practitioner focused on preventative care.',
    experienceYears: 8,
    workingHours: [
      { dayOfWeek: 0, isDayOff: true },
      { dayOfWeek: 1, startTime: '08:00', endTime: '16:00', slotDuration: 15 },
      { dayOfWeek: 2, startTime: '08:00', endTime: '16:00', slotDuration: 15 },
      { dayOfWeek: 3, startTime: '08:00', endTime: '16:00', slotDuration: 15 },
      { dayOfWeek: 4, startTime: '08:00', endTime: '16:00', slotDuration: 15 },
      { dayOfWeek: 5, startTime: '08:00', endTime: '12:00', slotDuration: 15 },
      { dayOfWeek: 6, isDayOff: true }
    ]
  }
];

const patients = [
  { name: 'Ahmed Hassan', email: 'ahmed.hassan@gmail.com', password: 'Patient@123', role: 'patient', phone: '+201112223334', whatsappNumber: '+201112223334', isActive: true, isWhatsappVerified: true },
  { name: 'Layla Ibrahim', email: 'layla.ibrahim@gmail.com', password: 'Patient@123', role: 'patient', phone: '+201223334445', whatsappNumber: '+201223334445', isActive: true, isWhatsappVerified: true }
];

const admin = {
  name: 'System Admin',
  email: 'admin@clinicflow.com',
  password: 'Admin@123',
  role: 'admin',
  phone: '+201000000000',
  whatsappNumber: '+201000000000',
  isActive: true,
  isWhatsappVerified: true
};

const seed = async () => {
  await connectDB();

  console.log('🗑  Clearing existing data...');
  await Promise.all([User.deleteMany(), Appointment.deleteMany(), EMR.deleteMany(), Prescription.deleteMany(), Queue.deleteMany()]);

  console.log('🌱 Seeding users...');
  const createdDoctors = await User.create(doctors);
  const createdPatients = await User.create(patients);
  await User.create(admin);

  console.log('📅 Seeding appointments...');
  const today = new Date().toISOString().split('T')[0];
  await Appointment.create([
    { patient: createdPatients[0]._id, doctor: createdDoctors[0]._id, date: today, time: '10:00', status: 'confirmed', type: 'regular' },
    { patient: createdPatients[1]._id, doctor: createdDoctors[1]._id, date: today, time: '09:00', status: 'pending', type: 'regular' }
  ]);

  console.log('\n✅ Seeding complete!\n');
  console.log('📋 Test credentials:');
  console.log('   Admin   → admin@clinicflow.com    / Admin@123');
  console.log('   Doctor  → sarah.mitchell@clinicflow.com / Doctor@123');
  console.log('   Doctor  → james.okafor@clinicflow.com  / Doctor@123');
  console.log('   Patient → ahmed.hassan@gmail.com   / Patient@123');
  console.log('   Patient → layla.ibrahim@gmail.com  / Patient@123\n');

  await mongoose.disconnect();
};

seed().catch(err => {
  console.error('Seeder error:', err);
  process.exit(1);
});
