const appointmentService = require('../services/appointmentService');
const queueService = require('../services/queueService');

/**
 * @swagger
 * /api/appointments/book:
 *   post:
 *     summary: Book a new appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *               - date
 *               - time
 *             properties:
 *               doctorId:
 *                 type: string
 *               date:
 *                 type: string
 *                 example: "YYYY-MM-DD"
 *               time:
 *                 type: string
 *                 example: "HH:MM"
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment booked successfully
 */
const book = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      patientId: req.user.id
    };
    const appointment = await appointmentService.bookAppointment(payload);
    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    if (error.message === 'This time slot is already booked') {
      res.status(400);
    }
    next(error);
  }
};

/**
 * @swagger
 * /api/appointments/my-appointments:
 *   get:
 *     summary: Get logged-in patient's appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 */
const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await appointmentService.getPatientAppointments(req.user.id);
    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/appointments/schedule:
 *   get:
 *     summary: Get doctor's schedule
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           example: "YYYY-MM-DD"
 */
const getSchedule = async (req, res, next) => {
  try {
    const { date } = req.query;
    const appointments = await appointmentService.getDoctorSchedule(req.user.id, date);
    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/appointments/{id}/status:
 *   patch:
 *     summary: Update appointment status (Cancel, Confirm, etc.)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 */
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const appointment = await appointmentService.updateAppointmentStatus(id, status, req.user.id, req.user.role);
    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    if (error.message === 'Unauthorized to modify this appointment' || error.message === 'Patients can only cancel appointments') {
      res.status(403);
    } else if (error.message === 'Appointment not found') {
      res.status(404);
    }
    next(error);
  }
};

/**
 * @swagger
 * /api/appointments/join-queue:
 *   post:
 *     summary: Join a live queue for a walk-in today
 *     tags: [Appointments]
 */
const joinLiveQueue = async (req, res, next) => {
  try {
    const { doctorId } = req.body;
    const queueEntry = await queueService.joinLiveQueue(req.user.id, doctorId);
    res.status(201).json({ success: true, data: queueEntry });
  } catch (error) {
    if (error.message === 'You are already in the queue for today' || error.message === 'Invalid doctor') {
      res.status(400);
    }
    next(error);
  }
};

module.exports = {
  book,
  getMyAppointments,
  getSchedule,
  updateStatus,
  joinLiveQueue
};
