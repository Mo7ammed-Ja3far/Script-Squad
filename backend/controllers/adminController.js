const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const EMR = require('../models/EMR');
const Prescription = require('../models/Prescription');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.role) query.role = req.query.role;
    
    const users = await User.find(query).select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user and cascade
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Cascade delete related entities
    await Appointment.deleteMany({ $or: [{ doctor: user._id }, { patient: user._id }] });
    await Queue.deleteMany({ $or: [{ doctor: user._id }, { patient: user._id }] });
    await EMR.deleteMany({ patient: user._id });
    await Prescription.deleteMany({ $or: [{ doctor: user._id }, { patient: user._id }] });
    
    await user.deleteOne();
    
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all appointments across clinic
// @route   GET /api/admin/appointments
// @access  Private/Admin
const getAppointments = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.date) query.date = req.query.date;

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name department')
      .sort({ date: -1, time: -1 });

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete appointment globally
// @route   DELETE /api/admin/appointments/:id
// @access  Private/Admin
const deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    await appointment.deleteOne();
    
    // Clean up queue if it was an active session
    await Queue.findOneAndDelete({ appointment: req.params.id });

    res.status(200).json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  deleteUser,
  getAppointments,
  deleteAppointment
};
