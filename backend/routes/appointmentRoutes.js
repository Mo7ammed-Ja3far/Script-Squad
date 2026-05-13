const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { z } = require('zod');

// Validations
const bookSchema = {
  body: z.object({
    doctorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ID'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
    notes: z.string().optional()
  }).strict()
};

const joinQueueSchema = {
  body: z.object({
    doctorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ID')
  }).strict()
};

const updateStatusSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ID')
  }),
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'])
  }).strict()
};

// Routes
// Join live walk-in queue
router.post('/join-queue', protect, authorize('patient', 'admin'), validate(joinQueueSchema), appointmentController.joinLiveQueue);

// Book a new appointment (Protected for patient & admin)
router.post('/book', protect, authorize('patient', 'admin'), validate(bookSchema), appointmentController.book);

// Patient getting their own appointments
router.get('/my-appointments', protect, authorize('patient'), appointmentController.getMyAppointments);

// Doctor getting their own schedule
router.get('/schedule', protect, authorize('doctor'), appointmentController.getSchedule);

// Update status (Everyone can access but logic restricts to authorized actions)
router.patch('/:id/status', protect, validate(updateStatusSchema), appointmentController.updateStatus);

module.exports = router;
