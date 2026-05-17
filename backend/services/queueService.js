const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const whatsappService = require('./whatsapp');

const POPULATE_PATIENT = { path: 'patient', select: 'name email phone whatsappNumber isWhatsappVerified' };
const POPULATE_DOCTOR = { path: 'doctor', select: 'name department specialization' };
const POPULATE_APPT = { path: 'appointment', select: 'date time type notes status' };

let _io = null;
const setIo = (io) => { _io = io; };

const emit = (event, room, payload) => {
  if (_io) _io.to(room).emit(event, payload);
};

const joinQueue = async (appointmentId, patientId) => {
  const appointment = await Appointment.findById(appointmentId).populate('doctor', 'name department specialization');
  if (!appointment) throw { status: 404, message: 'Appointment not found.' };
  if (appointment.patient.toString() !== patientId.toString()) throw { status: 403, message: 'Access denied.' };
  if (appointment.status === 'cancelled') throw { status: 400, message: 'Cannot join queue for a cancelled appointment.' };
  if (appointment.status === 'completed') throw { status: 400, message: 'This appointment has already been completed.' };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const apptDate = new Date(appointment.date); apptDate.setHours(0, 0, 0, 0);
  if (apptDate.getTime() !== today.getTime()) {
    throw { status: 400, message: 'You can only join the queue on the day of your appointment.' };
  }

  const existing = await Queue.findOne({ appointment: appointmentId, status: { $in: ['waiting', 'in-progress'] } });
  if (existing) throw { status: 409, message: 'You are already in the queue for this appointment.' };

  const last = await Queue.findOne({ doctor: appointment.doctor._id, date: { $gte: today } }).sort({ queueNumber: -1 });
  const queueNumber = last ? last.queueNumber + 1 : 1;

  const queueEntry = await Queue.create({ doctor: appointment.doctor._id, patient: patientId, appointment: appointmentId, date: today, queueNumber });
  await Appointment.findByIdAndUpdate(appointmentId, { status: 'confirmed' });

  const populated = await queueEntry.populate([POPULATE_PATIENT, POPULATE_DOCTOR, POPULATE_APPT]);

  const waitingBefore = await Queue.countDocuments({ doctor: appointment.doctor._id, date: { $gte: today }, status: 'waiting', queueNumber: { $lt: queueNumber } });
  const estimatedWait = waitingBefore * 20;

  emit('QUEUE_PATIENT_JOINED', `queue:${appointment.doctor._id.toString()}`, {
    queueEntry: populated,
    queueNumber,
    estimatedWaitMinutes: estimatedWait
  });

  emit('APPOINTMENT_CONFIRMED', `user:${patientId.toString()}`, {
    appointmentId,
    queueNumber,
    estimatedWaitMinutes: estimatedWait
  });

  const patient = await User.findById(patientId);
  if (patient.whatsappNumber && patient.isWhatsappVerified) {
    whatsappService.sendQueueJoinedNotice({ patient, doctor: appointment.doctor, queueNumber, estimatedWait })
      .catch(err => console.error('[WhatsApp] Queue joined notice failed:', err.message));
  }

  return { queueEntry: populated, queueNumber, estimatedWaitMinutes: estimatedWait };
};

const getDoctorQueue = async (doctorId, date) => {
  const today = date ? new Date(date) : new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const queue = await Queue.find({ doctor: doctorId, date: { $gte: today, $lt: tomorrow } })
    .populate(POPULATE_PATIENT).populate(POPULATE_DOCTOR).populate(POPULATE_APPT).sort({ queueNumber: 1 });

  const summary = {
    total: queue.length,
    waiting: queue.filter(q => q.status === 'waiting').length,
    inProgress: queue.filter(q => q.status === 'in-progress').length,
    completed: queue.filter(q => q.status === 'completed').length,
    cancelled: queue.filter(q => q.status === 'cancelled').length
  };

  return { queue, summary, date: today };
};

const callNext = async (doctorId) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const current = await Queue.findOne({ doctor: doctorId, status: 'in-progress' });
  if (current) throw { status: 400, message: 'A patient is currently in progress. Complete the consultation first.' };

  const next = await Queue.findOne({ doctor: doctorId, date: { $gte: today }, status: 'waiting' })
    .sort({ queueNumber: 1 }).populate(POPULATE_PATIENT).populate(POPULATE_DOCTOR).populate(POPULATE_APPT);

  if (!next) return { queueEntry: null, message: 'No more patients in queue.' };

  next.status = 'in-progress';
  next.calledAt = new Date();
  await next.save();

  emit('PATIENT_CALLED', `queue:${doctorId.toString()}`, { queueEntry: next });
  emit('YOUR_TURN', `user:${next.patient._id.toString()}`, {
    message: 'It is your turn! Please proceed to the consultation room.',
    queueNumber: next.queueNumber,
    doctorName: next.doctor.name
  });

  const remaining = await Queue.countDocuments({ doctor: doctorId, date: { $gte: today }, status: 'waiting' });
  emit('QUEUE_UPDATED', `queue:${doctorId.toString()}`, { remaining });

  return { queueEntry: next };
};

const removeFromQueue = async (queueId, doctorId) => {
  const entry = await Queue.findById(queueId);
  if (!entry) throw { status: 404, message: 'Queue entry not found.' };
  if (entry.doctor.toString() !== doctorId.toString()) throw { status: 403, message: 'Access denied.' };
  if (entry.status === 'completed') throw { status: 400, message: 'Queue entry already completed.' };

  entry.status = 'cancelled';
  await entry.save();

  emit('QUEUE_PATIENT_REMOVED', `queue:${doctorId.toString()}`, { queueId });
  return entry;
};

module.exports = { joinQueue, getDoctorQueue, callNext, removeFromQueue, setIo };
