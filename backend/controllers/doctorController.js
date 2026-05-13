const doctorService = require('../services/doctorService');
const availabilityService = require('../services/availabilityService');
const User = require('../models/User');

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Get all doctors
 */
const getDoctors = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.department) {
      filters.department = req.query.department;
    }
    const doctors = await doctorService.getDoctors(filters);
    res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/doctors/{id}/profile:
 *   get:
 *     summary: Get a specific doctor's full profile
 */
const getDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await User.findById(req.params.id).select('-password -role -createdAt -updatedAt');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/doctors/{id}/available-slots:
 *   get:
 *     summary: Get calculated available slots for a specific date
 */
const getAvailableSlots = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required (YYYY-MM-DD)' });
    }

    const slots = await availabilityService.getAvailableSlots(id, date);
    res.status(200).json({ success: true, data: slots });
  } catch (error) {
    if (error.message === 'Doctor not found') {
      res.status(404);
    }
    next(error);
  }
};

/**
 * @swagger
 * /api/doctors/{id}/schedule:
 *   patch:
 *     summary: Update doctor schedule and profile credentials
 */
const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Authorization check: Must be the admin or the exact doctor
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
    }

    const updatedDoctor = await User.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password -role');

    if (!updatedDoctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    res.status(200).json({ success: true, data: updatedDoctor });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctorProfile,
  getAvailableSlots,
  updateSchedule
};
