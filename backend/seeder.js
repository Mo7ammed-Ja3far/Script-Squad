require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Appointment = require("./models/Appointment");
const EMR = require("./models/EMR");
const Prescription = require("./models/Prescription");
const Queue = require("./models/Queue");

const connectDB = require("./config/db");

const departments = [
  "Cardiology",
  "General Medicine",
  "Pediatrics",
  "Dermatology",
  "Orthopedics",
  "Neurology",
];
const specializations = [
  "Interventional Cardiology",
  "Internal Medicine",
  "General Pediatrics",
  "Clinical Dermatology",
  "Joint Replacement",
  "Clinical Neurology",
];

const doctorFirstNames = [
  "Ahmed",
  "Mohamed",
  "Mahmoud",
  "Tarek",
  "Hany",
  "Amr",
  "Wael",
  "Sherif",
  "Sarah",
  "Layla",
  "Noha",
  "Mona",
];
const doctorLastNames = [
  "Mansour",
  "Hassan",
  "El-Shamy",
  "Gharib",
  "Abdel-Aziz",
  "Fathy",
  "Rashed",
  "El-Sawy",
  "Radwan",
  "El-Din",
];

const patientFirstNames = [
  "Ahmed",
  "Layla",
  "Mohamed",
  "Fatma",
  "Ali",
  "Zainab",
  "Omar",
  "Aisha",
  "Youssef",
  "Mariam",
  "Khaled",
  "Nour",
];
const patientLastNames = [
  "Hassan",
  "Ibrahim",
  "Ali",
  "Mansour",
  "Mustafa",
  "Khalil",
  "Mahmoud",
  "Salim",
  "Rashed",
  "Gaber",
];

const generateData = () => {
  const doctorsList = [];
  const patientsList = [];

  for (let i = 1; i <= 50; i++) {
    const firstName = doctorFirstNames[i % doctorFirstNames.length];
    const lastName = doctorLastNames[i % doctorLastNames.length];
    const deptIndex = i % departments.length;
    const phoneNum = `+20100${String(i).padStart(7, "0")}`;

    doctorsList.push({
      name: `Dr. ${firstName} ${lastName}`,
      email: `doctor${i}@clinicflow.com`,
      password: "Doctor@123",
      role: "doctor",
      phone: phoneNum,
      whatsappNumber: phoneNum,
      isActive: true,
      isWhatsappVerified: true,
      department: departments[deptIndex],
      specialization: specializations[deptIndex],
      consultationFee: 150 + (i % 5) * 50,
      bio: `Experienced specialist in ${specializations[deptIndex]} with over ${5 + (i % 15)} years of practice in Egypt.`,
      experienceYears: 5 + (i % 15),
      workingHours: [
        { dayOfWeek: 0, isDayOff: true },
        {
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "17:00",
          slotDuration: 20,
        },
        {
          dayOfWeek: 2,
          startTime: "09:00",
          endTime: "17:00",
          slotDuration: 20,
        },
        {
          dayOfWeek: 3,
          startTime: "09:00",
          endTime: "17:00",
          slotDuration: 20,
        },
        {
          dayOfWeek: 4,
          startTime: "09:00",
          endTime: "17:00",
          slotDuration: 20,
        },
        {
          dayOfWeek: 5,
          startTime: "09:00",
          endTime: "14:00",
          slotDuration: 20,
        },
        { dayOfWeek: 6, isDayOff: true },
      ],
    });
  }

  for (let i = 1; i <= 200; i++) {
    const firstName = patientFirstNames[i % patientFirstNames.length];
    const lastName = patientLastNames[i % patientLastNames.length];
    const phoneNum = `+20111${String(i).padStart(7, "0")}`;

    patientsList.push({
      name: `${firstName} ${lastName}`,
      email: `patient${i}@gmail.com`,
      password: "Patient@123",
      role: "patient",
      phone: phoneNum,
      whatsappNumber: phoneNum,
      isActive: true,
      isWhatsappVerified: true,
    });
  }

  return { doctorsList, patientsList };
};

const admin = {
  name: "System Admin",
  email: "admin@clinicflow.com",
  password: "Admin@123",
  role: "admin",
  phone: "+201000000000",
  whatsappNumber: "+201000000000",
  isActive: true,
  isWhatsappVerified: true,
};

const seed = async () => {
  await connectDB();

  console.log("🗑  Clearing existing data...");
  await Promise.all([
    User.deleteMany(),
    Appointment.deleteMany(),
    EMR.deleteMany(),
    Prescription.deleteMany(),
    Queue.deleteMany(),
  ]);

  const { doctorsList, patientsList } = generateData();

  console.log(
    `🌱 Seeding users (1 Admin, ${doctorsList.length} Doctors, ${patientsList.length} Patients)...`,
  );
  const createdDoctors = await User.create(doctorsList);
  const createdPatients = await User.create(patientsList);
  await User.create(admin);

  console.log("📅 Seeding bulk appointments...");
  const today = new Date().toISOString().split("T")[0];
  const appointmentsList = [];
  const times = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
  ];
  const statuses = ["confirmed", "pending", "completed"];

  // 🛠 التعديل هنا: استخدام Set لمنع تكرار (الدكتور + الساعة) نهائياً
  const bookedSlots = new Set();

  while (appointmentsList.length < 100) {
    const randomPatient =
      createdPatients[Math.floor(Math.random() * createdPatients.length)];
    const randomDoctor =
      createdDoctors[Math.floor(Math.random() * createdDoctors.length)];
    const randomTime = times[Math.floor(Math.random() * times.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    // مفتاح فريد يدمج معرف الدكتور مع الساعة واليوم
    const slotKey = `${randomDoctor._id}_${today}_${randomTime}`;

    // لو المفتاح مش محجوز قبل كده، ضيف الميعاد
    if (!bookedSlots.has(slotKey)) {
      bookedSlots.add(slotKey);

      appointmentsList.push({
        patient: randomPatient._id,
        doctor: randomDoctor._id,
        date: today,
        time: randomTime,
        status: randomStatus,
        type: "regular",
      });
    }
  }

  await Appointment.create(appointmentsList);

  console.log("\n✅ Seeding complete successfully with Egyptian profiles!\n");
  console.log("📋 Credentials structure for testing:");
  console.log("   Admin    → admin@clinicflow.com / Admin@123");
  console.log(
    "   Doctors  → doctor1@clinicflow.com up to doctor50@clinicflow.com / Password: Doctor@123",
  );
  console.log(
    "   Patients → patient1@gmail.com up to patient200@gmail.com / Password: Patient@123\n",
  );

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error("Seeder error:", err);
  process.exit(1);
});
