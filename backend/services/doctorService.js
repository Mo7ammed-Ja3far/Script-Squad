const User = require('../models/User');
const Appointment = require('../models/Appointment');

const DOCTOR_PUBLIC_FIELDS = 'name department specialization consultationFee bio experienceYears credentials workingHours';

const listDoctors = async ({ department, specialization, page = 1, limit = 20 }) => {
  const filter = { role: 'doctor', isActive: true };
  if (department) filter.department = { $regex: department, $options: 'i' };
  if (specialization) filter.specialization = { $regex: specialization, $options: 'i' };

  const skip = (page - 1) * limit;
  const [doctors, total] = await Promise.all([
    User.find(filter).select(DOCTOR_PUBLIC_FIELDS).skip(skip).limit(Number(limit)).sort({ name: 1 }),
    User.countDocuments(filter)
  ]);
  return { doctors, total };
};

const getDoctorById = async (doctorId) => {
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true }).select(DOCTOR_PUBLIC_FIELDS);
  if (!doctor) throw { status: 404, message: 'Doctor not found.' };
  return doctor;
};

const getDoctorStats = async (doctorId) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [total, completed, pending, todayAppts] = await Promise.all([
    Appointment.countDocuments({ doctor: doctorId }),
    Appointment.countDocuments({ doctor: doctorId, status: 'completed' }),
    Appointment.countDocuments({ doctor: doctorId, status: { $in: ['pending', 'confirmed'] } }),
    Appointment.countDocuments({ doctor: doctorId, date: today.toISOString().split('T')[0] })
  ]);
  return { total, completed, pending, cancelled: total - completed - pending, today: todayAppts };
};

const updateDoctorSchedule = async (doctorId, workingHours) => {
  const doctor = await User.findByIdAndUpdate(doctorId, { workingHours }, { new: true, runValidators: true }).select(DOCTOR_PUBLIC_FIELDS);
  if (!doctor) throw { status: 404, message: 'Doctor not found.' };
  return doctor;
};

module.exports = { listDoctors, getDoctorById, getDoctorStats, updateDoctorSchedule };
