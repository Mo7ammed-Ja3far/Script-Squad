const doctorService = require('../services/doctorService');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const listDoctors = async (req, res) => {
  try {
    const { department, specialization, page = 1, limit = 20 } = req.query;
    const { doctors, total } = await doctorService.listDoctors({ department, specialization, page, limit });
    res.status(200).json(paginatedResponse({ doctors }, 'Doctors retrieved successfully.', page, limit, total));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const getDoctor = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    res.status(200).json(successResponse({ doctor }, 'Doctor retrieved successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const getMyStats = async (req, res) => {
  try {
    const stats = await doctorService.getDoctorStats(req.user._id);
    res.status(200).json(successResponse({ stats }, 'Doctor stats retrieved successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const updateSchedule = async (req, res) => {
  try {
    const doctor = await doctorService.updateDoctorSchedule(req.user._id, req.body.workingHours);
    res.status(200).json(successResponse({ doctor }, 'Schedule updated successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

module.exports = { listDoctors, getDoctor, getMyStats, updateSchedule };
