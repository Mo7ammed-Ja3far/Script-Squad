const User = require('../models/User');
const Appointment = require('../models/Appointment');
const EMR = require('../models/EMR');
const Prescription = require('../models/Prescription');
const Queue = require('../models/Queue');

const listUsers = async ({ role, isActive, page = 1, limit = 20, search }) => {
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } }
  ];

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).select('-password').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    User.countDocuments(filter)
  ]);
  return { users, total };
};

const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) throw { status: 404, message: 'User not found.' };
  return user;
};

const updateUser = async (userId, updates) => {
  const forbidden = ['password'];
  forbidden.forEach(f => delete updates[f]);
  const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select('-password');
  if (!user) throw { status: 404, message: 'User not found.' };
  return user;
};

const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: 'User not found.' };

  await Promise.all([
    Appointment.deleteMany({ $or: [{ patient: userId }, { doctor: userId }] }),
    EMR.deleteMany({ patient: userId }),
    Prescription.deleteMany({ $or: [{ patient: userId }, { doctor: userId }] }),
    Queue.deleteMany({ $or: [{ patient: userId }, { doctor: userId }] })
  ]);

  await User.findByIdAndDelete(userId);
  return { deletedUserId: userId };
};

const getDashboardStats = async () => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    totalPatients, totalDoctors, totalAdmins,
    totalAppointments, todayAppointments,
    appointmentsByStatus, weeklyAppointments,
    totalPrescriptions, totalEMRs,
    activeQueue, recentPatients
  ] = await Promise.all([
    User.countDocuments({ role: 'patient', isActive: true }),
    User.countDocuments({ role: 'doctor', isActive: true }),
    User.countDocuments({ role: 'admin' }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ date: todayStr }),
    Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Appointment.countDocuments({ date: { $gte: weekAgo.toISOString().split('T')[0] } }),
    Prescription.countDocuments(),
    EMR.countDocuments(),
    Queue.countDocuments({ date: { $gte: today }, status: { $in: ['waiting', 'in-progress'] } }),
    User.find({ role: 'patient', isActive: true }).select('name email createdAt').sort({ createdAt: -1 }).limit(5)
  ]);

  const statusMap = {};
  appointmentsByStatus.forEach(s => { statusMap[s._id] = s.count; });

  return {
    users: { patients: totalPatients, doctors: totalDoctors, admins: totalAdmins, total: totalPatients + totalDoctors + totalAdmins },
    appointments: {
      total: totalAppointments,
      today: todayAppointments,
      thisWeek: weeklyAppointments,
      byStatus: {
        pending: statusMap.pending || 0,
        confirmed: statusMap.confirmed || 0,
        completed: statusMap.completed || 0,
        cancelled: statusMap.cancelled || 0,
        rescheduled: statusMap.rescheduled || 0
      }
    },
    medical: { prescriptions: totalPrescriptions, emrRecords: totalEMRs },
    queue: { activeToday: activeQueue },
    recentPatients
  };
};

const listAllAppointments = async ({ status, dateFrom, dateTo, doctorId, patientId, page = 1, limit = 20 }) => {
  const filter = {};
  if (status) filter.status = status;
  if (doctorId) filter.doctor = doctorId;
  if (patientId) filter.patient = patientId;
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = dateFrom;
    if (dateTo) filter.date.$lte = dateTo;
  }

  const skip = (page - 1) * limit;
  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patient', 'name email phone whatsappNumber')
      .populate('doctor', 'name department specialization')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Appointment.countDocuments(filter)
  ]);
  return { appointments, total };
};

module.exports = { listUsers, getUserById, updateUser, deleteUser, getDashboardStats, listAllAppointments };
