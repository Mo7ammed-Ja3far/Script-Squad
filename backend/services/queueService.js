const Queue = require('../models/Queue');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

const joinLiveQueue = async (patientId, doctorId) => {
  // 1. Validate doctor
  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    throw new Error('Invalid doctor');
  }

  // 2. Get start and end of today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // 3. Check if patient already in queue today
  const existingEntry = await Queue.findOne({
    patient: patientId,
    doctor: doctorId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['waiting', 'in-progress'] }
  });

  if (existingEntry) {
    throw new Error('You are already in the queue for today');
  }

  // 4. Calculate next queue number
  const lastQueue = await Queue.findOne({
    doctor: doctorId,
    date: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ queueNumber: -1 });

  const queueNumber = lastQueue ? lastQueue.queueNumber + 1 : 1;

  // 5. Create a "walk-in" appointment reference
  const now = new Date();
  const dateString = now.toISOString().split('T')[0];
  const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const appointment = await Appointment.create({
    patient: patientId,
    doctor: doctorId,
    date: dateString,
    time: timeString, // walk-in time bypasses slot constraints
    status: 'confirmed', // immediately confirmed since they are here
    type: 'regular',
    notes: 'Walk-in Live Queue'
  });

  // 6. Join the queue
  const queueEntry = await Queue.create({
    doctor: doctorId,
    patient: patientId,
    appointment: appointment._id,
    date: now,
    status: 'waiting',
    queueNumber
  });

  return queueEntry;
};

module.exports = {
  joinLiveQueue
};
