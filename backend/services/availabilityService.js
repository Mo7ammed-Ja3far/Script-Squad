const User = require('../models/User');
const Appointment = require('../models/Appointment');

const getAvailableSlots = async (doctorId, date) => {
  // date format: YYYY-MM-DD
  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    throw new Error('Doctor not found');
  }

  // Get day of week from date (Note: assuming UTC to avoid timezone shifts)
  const targetDate = new Date(`${date}T00:00:00Z`);
  const dayOfWeek = targetDate.getUTCDay(); // 0 = Sunday, ..., 6 = Saturday

  const daySchedule = doctor.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);

  if (!daySchedule || daySchedule.isDayOff || !daySchedule.startTime || !daySchedule.endTime) {
    return []; // Doctor is not working on this day
  }

  // Generate all possible slots
  const slots = [];
  const startParts = daySchedule.startTime.split(':').map(Number);
  const endParts = daySchedule.endTime.split(':').map(Number);
  
  const startMins = startParts[0] * 60 + startParts[1];
  const endMins = endParts[0] * 60 + endParts[1];
  const slotDuration = daySchedule.slotDuration || 20;

  for (let currentMins = startMins; currentMins + slotDuration <= endMins; currentMins += slotDuration) {
    const h = Math.floor(currentMins / 60).toString().padStart(2, '0');
    const m = (currentMins % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
  }

  // Fetch booked appointments for this date
  const bookedAppointments = await Appointment.find({
    doctor: doctorId,
    date,
    status: { $in: ['pending', 'confirmed'] }
  });

  const bookedTimes = bookedAppointments.map(app => app.time);

  // Filter out booked slots
  const availableSlots = slots.filter(slot => !bookedTimes.includes(slot));

  return availableSlots;
};

module.exports = {
  getAvailableSlots
};
