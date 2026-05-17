const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Queue = require('../models/Queue');
const whatsappService = require('./whatsapp');

const POPULATE_PATIENT = { path: 'patient', select: 'name email phone whatsappNumber' };
const POPULATE_DOCTOR = { path: 'doctor', select: 'name department specialization consultationFee workingHours' };

const enrichAppointment = (appt) => appt;

const bookAppointment = async ({ patientId, doctorId, date, time, type, notes }) => {
  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor') throw { status: 404, message: 'Doctor not found.' };

  const patient = await User.findById(patientId);
  if (!patient) throw { status: 404, message: 'Patient not found.' };

  const conflict = await Appointment.findOne({ doctor: doctorId, date, time, status: { $nin: ['cancelled'] } });
  if (conflict) throw { status: 409, message: 'This time slot is already booked. Please choose another.' };

  const appointment = await Appointment.create({ patient: patientId, doctor: doctorId, date, time, type: type || 'regular', notes });
  const populated = await appointment.populate([POPULATE_PATIENT, POPULATE_DOCTOR]);

  if (patient.whatsappNumber && patient.isWhatsappVerified) {
    whatsappService.sendAppointmentConfirmation(populated, patient, doctor).catch(err =>
      console.error('[WhatsApp] Confirmation failed:', err.message)
    );
  }

  return populated;
};

const getAppointmentById = async (appointmentId, requestingUser) => {
  const appt = await Appointment.findById(appointmentId).populate(POPULATE_PATIENT).populate(POPULATE_DOCTOR);
  if (!appt) throw { status: 404, message: 'Appointment not found.' };

  if (requestingUser.role === 'patient' && appt.patient._id.toString() !== requestingUser._id.toString()) {
    throw { status: 403, message: 'Access denied.' };
  }
  if (requestingUser.role === 'doctor' && appt.doctor._id.toString() !== requestingUser._id.toString()) {
    throw { status: 403, message: 'Access denied.' };
  }
  return appt;
};

const listAppointments = async ({ userId, role, status, dateFrom, dateTo, page = 1, limit = 20 }) => {
  const filter = {};
  if (role === 'patient') filter.patient = userId;
  if (role === 'doctor') filter.doctor = userId;
  if (status) filter.status = status;
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = dateFrom;
    if (dateTo) filter.date.$lte = dateTo;
  }

  const skip = (page - 1) * limit;
  const [appointments, total] = await Promise.all([
    Appointment.find(filter).populate(POPULATE_PATIENT).populate(POPULATE_DOCTOR).sort({ date: -1, time: -1 }).skip(skip).limit(Number(limit)),
    Appointment.countDocuments(filter)
  ]);
  return { appointments, total };
};

const cancelAppointment = async (appointmentId, requestingUser, reason) => {
  const appt = await Appointment.findById(appointmentId).populate(POPULATE_PATIENT).populate(POPULATE_DOCTOR);
  if (!appt) throw { status: 404, message: 'Appointment not found.' };

  const isPatient = requestingUser.role === 'patient' && appt.patient._id.toString() === requestingUser._id.toString();
  const isDoctor = requestingUser.role === 'doctor' && appt.doctor._id.toString() === requestingUser._id.toString();
  const isAdmin = requestingUser.role === 'admin';

  if (!isPatient && !isDoctor && !isAdmin) throw { status: 403, message: 'Access denied.' };
  if (['completed', 'cancelled'].includes(appt.status)) {
    throw { status: 400, message: `Cannot cancel an appointment that is already ${appt.status}.` };
  }

  appt.status = 'cancelled';
  if (reason) appt.notes = appt.notes ? `${appt.notes} | Cancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
  await appt.save();

  await Queue.deleteOne({ appointment: appointmentId, status: 'waiting' });

  const patient = appt.patient;
  if (patient.whatsappNumber && patient.isWhatsappVerified) {
    whatsappService.sendCancellationNotice(appt, patient, appt.doctor, reason).catch(err =>
      console.error('[WhatsApp] Cancellation notice failed:', err.message)
    );
  }

  return appt;
};

const rescheduleAppointment = async (appointmentId, requestingUser, { newDate, newTime }) => {
  const appt = await Appointment.findById(appointmentId).populate(POPULATE_PATIENT).populate(POPULATE_DOCTOR);
  if (!appt) throw { status: 404, message: 'Appointment not found.' };

  const isPatient = requestingUser.role === 'patient' && appt.patient._id.toString() === requestingUser._id.toString();
  const isAdmin = requestingUser.role === 'admin';
  if (!isPatient && !isAdmin) throw { status: 403, message: 'Only the patient or admin can reschedule.' };

  if (['completed', 'cancelled'].includes(appt.status)) {
    throw { status: 400, message: `Cannot reschedule an appointment that is already ${appt.status}.` };
  }

  const conflict = await Appointment.findOne({
    doctor: appt.doctor._id,
    date: newDate,
    time: newTime,
    status: { $nin: ['cancelled'] },
    _id: { $ne: appointmentId }
  });
  if (conflict) throw { status: 409, message: 'The requested slot is already booked. Please choose another.' };

  const oldDate = appt.date;
  const oldTime = appt.time;

  appt.rescheduledFrom = { date: oldDate, time: oldTime };
  appt.rescheduledAt = new Date();
  appt.date = newDate;
  appt.time = newTime;
  appt.status = 'rescheduled';
  await appt.save();

  const patient = appt.patient;
  if (patient.whatsappNumber && patient.isWhatsappVerified) {
    whatsappService.sendRescheduleNotice(appt, patient, appt.doctor, oldDate, oldTime).catch(err =>
      console.error('[WhatsApp] Reschedule notice failed:', err.message)
    );
  }

  return appt;
};

const getDoctorAvailability = async (doctorId, date) => {
  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor') throw { status: 404, message: 'Doctor not found.' };

  const dayOfWeek = new Date(date).getDay();
  const schedule = (doctor.workingHours || []).find(w => w.dayOfWeek === dayOfWeek);
  if (!schedule || schedule.isDayOff) return { available: false, slots: [] };

  const booked = await Appointment.find({ doctor: doctorId, date, status: { $nin: ['cancelled'] } }).select('time');
  const bookedTimes = new Set(booked.map(a => a.time));

  const slots = [];
  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  const duration = schedule.slotDuration || 20;

  for (let t = startTotal; t + duration <= endTotal; t += duration) {
    const h = String(Math.floor(t / 60)).padStart(2, '0');
    const m = String(t % 60).padStart(2, '0');
    const timeStr = `${h}:${m}`;
    slots.push({ time: timeStr, available: !bookedTimes.has(timeStr) });
  }

  return {
    available: true,
    doctor: { _id: doctor._id, name: doctor.name, department: doctor.department, specialization: doctor.specialization },
    date,
    schedule: { startTime: schedule.startTime, endTime: schedule.endTime, slotDuration: duration },
    slots,
    totalSlots: slots.length,
    availableSlots: slots.filter(s => s.available).length
  };
};

module.exports = { bookAppointment, getAppointmentById, listAppointments, cancelAppointment, rescheduleAppointment, getDoctorAvailability };
