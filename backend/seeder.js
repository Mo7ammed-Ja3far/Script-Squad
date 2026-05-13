const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Queue = require('./models/Queue');
const EMR = require('./models/EMR');
const Prescription = require('./models/Prescription');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const importData = async () => {
  try {
    // 1. Destroy all current data
    await User.deleteMany();
    await Appointment.deleteMany();
    await Queue.deleteMany();
    await EMR.deleteMany();
    await Prescription.deleteMany();

    console.log('✅ Data Cleared');

    // 2. Create Admin
    await User.create({
      name: 'System Admin',
      email: 'admin@clinicflow.com',
      password: 'password123',
      role: 'admin',
      phone: faker.phone.number()
    });

    // 3. Create Doctors
    const departments = ['Cardiology', 'Dentistry', 'Neurology', 'Orthopedics', 'Pediatrics'];
    const doctorsData = [];
    
    // Working hours: Mon-Fri (1-5), 09:00 - 17:00
    const workingHours = [];
    for (let i = 1; i <= 5; i++) {
      workingHours.push({
        dayOfWeek: i,
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30,
        isDayOff: false
      });
    }

    for (let i = 0; i < 5; i++) {
      doctorsData.push({
        name: `Dr. ${faker.person.lastName()}`,
        email: `doctor${i+1}@clinicflow.com`,
        password: 'password123',
        role: 'doctor',
        phone: faker.phone.number(),
        department: departments[i],
        specialization: faker.person.jobTitle(),
        consultationFee: faker.number.int({ min: 50, max: 200 }),
        bio: faker.lorem.paragraph(),
        experienceYears: faker.number.int({ min: 2, max: 30 }),
        credentials: [{
          degree: 'MD',
          institution: faker.company.name(),
          year: faker.number.int({ min: 1990, max: 2020 })
        }],
        workingHours
      });
    }

    const doctors = [];
    for (const doc of doctorsData) {
      doctors.push(await User.create(doc));
    }

    // 4. Create Patients
    const patientsData = [];
    for (let i = 0; i < 15; i++) {
      patientsData.push({
        name: faker.person.fullName(),
        email: `patient${i+1}@clinicflow.com`,
        password: 'password123',
        role: 'patient',
        phone: faker.phone.number()
      });
    }
    
    const patients = [];
    for (const pat of patientsData) {
      patients.push(await User.create(pat));
    }

    // 5. Create EMRs for first 4 patients
    for (let i = 0; i < 4; i++) {
      await EMR.create({
        patient: patients[i]._id,
        chronicDiseases: i % 2 === 0 ? ['Hypertension'] : ['Diabetes'],
        surgicalHistory: i === 0 ? ['Appendectomy'] : [],
        allergies: i === 1 ? ['Penicillin'] : [],
        history: []
      });
    }

    // 6. Book Future Appointments (Assuming they fit within 09:00 - 17:00, 30 min slots)
    // Find next Monday
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7));
    if (nextMonday.getDay() === 0) nextMonday.setDate(nextMonday.getDate() + 1); // Edge case if it somehow lands on sunday
    const dateString = nextMonday.toISOString().split('T')[0];

    const appointmentsData = [];
    for (let i = 0; i < 10; i++) {
      const h = 9 + Math.floor(i / 2);
      const m = i % 2 === 0 ? '00' : '30';
      const timeStr = `${h.toString().padStart(2, '0')}:${m}`;
      
      appointmentsData.push({
        patient: patients[i]._id,
        doctor: doctors[0]._id, // Put all these with Cardiology Dr.
        date: dateString,
        time: timeStr,
        status: 'pending',
        type: 'regular',
        notes: faker.lorem.sentence()
      });
    }
    
    await Appointment.insertMany(appointmentsData);

    // 7. Generate Live Queue for Today
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Pick doctor 1 (Dentistry)
    for (let i = 0; i < 3; i++) {
      const walkInAppt = await Appointment.create({
        patient: patients[10 + i]._id,
        doctor: doctors[1]._id,
        date: todayString,
        time: `${(10 + i).toString().padStart(2, '0')}:00`,
        status: 'confirmed',
        type: 'regular',
        notes: 'Walk-in'
      });

      await Queue.create({
        doctor: doctors[1]._id,
        patient: patients[10 + i]._id,
        appointment: walkInAppt._id,
        date: today,
        status: i === 0 ? 'in-progress' : 'waiting',
        queueNumber: i + 1
      });
    }

    console.log('✅ Data Imported!');
    process.exit();
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    await Appointment.deleteMany();
    await Queue.deleteMany();
    await EMR.deleteMany();
    await Prescription.deleteMany();

    console.log('✅ Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error('❌ Error destroying data:', error);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
