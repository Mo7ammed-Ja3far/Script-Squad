const Appointment = require('../models/Appointment');
const User = require('../models/User');
const availabilityService = require('./availabilityService');

const bookAppointment = async (payload) => {
  const { patientId, doctorId, date, time, notes } = payload;

  // 1. Check if doctor exists and is actually a doctor
  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    throw new Error('Invalid doctor selected');
  }

  // 2. Conflict Resolution: Ensure the time slot is valid and free
  const availableSlots = await availabilityService.getAvailableSlots(doctorId, date);
  
  if (!availableSlots.includes(time)) {
    throw new Error('This time slot is either invalid or already booked');
  }

  // 3. Create appointment
  const appointment = await Appointment.create({
    patient: patientId,
    doctor: doctorId,
    date,
    time,
    notes,
    status: 'pending'
  });

  return appointment;
};

const getPatientAppointments = async (patientId) => {
  return await Appointment.find({ patient: patientId })
    .populate('doctor', 'name department specialization')
    .sort({ date: 1, time: 1 });
};

const getDoctorSchedule = async (doctorId, date) => {
  const query = { doctor: doctorId };
  if (date) query.date = date;

  return await Appointment.find(query)
    .populate('patient', 'name email phone')
    .sort({ date: 1, time: 1 });
};

const updateAppointmentStatus = async (appointmentId, status, userId, userRole) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // RBAC for updating status
  if (userRole === 'patient') {
    // Patients can only cancel their own appointments
    if (appointment.patient.toString() !== userId) {
      throw new Error('Unauthorized to modify this appointment');
    }
    if (status !== 'cancelled') {
      throw new Error('Patients can only cancel appointments');
    }
  } else if (userRole === 'doctor') {
    // Doctors can manage their own schedule
    if (appointment.doctor.toString() !== userId) {
      throw new Error('Unauthorized to modify this appointment');
    }
  }
  // Admin bypass is implied since we don't block them here

  appointment.status = status;
  await appointment.save();

  return appointment;
};

module.exports = {
  bookAppointment,
  getPatientAppointments,
  getDoctorSchedule,
  updateAppointmentStatus
};
