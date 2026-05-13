const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { z } = require('zod');

// Validations
const updateScheduleSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ID')
  }),
  body: z.object({
    bio: z.string().optional(),
    experienceYears: z.number().optional(),
    credentials: z.array(z.object({
      degree: z.string(),
      institution: z.string(),
      year: z.number()
    })).optional(),
    workingHours: z.array(z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be HH:MM'),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be HH:MM'),
      slotDuration: z.number().min(5).max(120).optional(),
      isDayOff: z.boolean().optional()
    })).optional()
  }).strict()
};

router.get('/', protect, doctorController.getDoctors);
router.get('/:id/profile', protect, doctorController.getDoctorProfile);
router.get('/:id/available-slots', protect, doctorController.getAvailableSlots);
router.patch('/:id/schedule', protect, authorize('doctor', 'admin'), validate(updateScheduleSchema), doctorController.updateSchedule);

module.exports = router;
