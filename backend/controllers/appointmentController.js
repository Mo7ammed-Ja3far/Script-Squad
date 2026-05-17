const appointmentService = require('../services/appointmentService');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const book = async (req, res) => {
  try {
    const appointment = await appointmentService.bookAppointment({
      patientId: req.user._id,
      ...req.body
    });
    res.status(201).json(successResponse({ appointment }, 'Appointment booked successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const getOne = async (req, res) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id, req.user);
    res.status(200).json(successResponse({ appointment }, 'Appointment retrieved successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const list = async (req, res) => {
  try {
    const { status, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const { appointments, total } = await appointmentService.listAppointments({
      userId: req.user._id,
      role: req.user.role,
      status, dateFrom, dateTo, page, limit
    });
    res.status(200).json(paginatedResponse({ appointments }, 'Appointments retrieved successfully.', page, limit, total));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const cancel = async (req, res) => {
  try {
    const appointment = await appointmentService.cancelAppointment(req.params.id, req.user, req.body.reason);
    res.status(200).json(successResponse({ appointment }, 'Appointment cancelled successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const reschedule = async (req, res) => {
  try {
    const appointment = await appointmentService.rescheduleAppointment(req.params.id, req.user, req.body);
    res.status(200).json(successResponse({ appointment }, 'Appointment rescheduled successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const availability = async (req, res) => {
  try {
    const data = await appointmentService.getDoctorAvailability(req.params.doctorId, req.query.date);
    res.status(200).json(successResponse(data, 'Availability retrieved successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

module.exports = { book, getOne, list, cancel, reschedule, availability };
